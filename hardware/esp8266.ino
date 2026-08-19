/* =====================================================
   ESP8266 - Sensor ultrassônico + Login + Atualizar status
   da tabela "coletores" no Supabase via REST API
   =====================================================

   Se a tabela "coletores" tiver RLS restringindo UPDATE
   ao role "authenticated" (igual à tabela "maquinas"),
   a anon key sozinha NÃO tem permissão de PATCH — é
   preciso fazer login antes para obter um access_token
   (JWT) válido.

   Bibliotecas necessárias:
   - ESP8266WiFi
   - ESP8266HTTPClient
   - WiFiClientSecure
   - ArduinoJson (instale pelo Gerenciador de Bibliotecas)
===================================================== */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// ---------- CONFIGURAÇÕES DE REDE ----------
const char* WIFI_SSID     = "Hector09910";
const char* WIFI_PASSWORD = "Heitor 08";

// ---------- CONFIGURAÇÕES SUPABASE ----------
const char* SUPABASE_URL      = "wojftcqshaumsdqrhqkj.supabase.co"; // sem https://
const char* SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvamZ0Y3FzaGF1bXNkcXJocWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MjkzMzYsImV4cCI6MjA5NjUwNTMzNn0.s88OJT_V32AoopQq2utfUpqnQcQPtDSmiwD8EdiCbNw";

// Credenciais de um usuário com permissão de UPDATE (deve satisfazer a policy)
const char* USER_EMAIL    = "projeto.sicrai.ourobranco@ifmg.edu.br";
const char* USER_PASSWORD = "111111";

const char* TABELA = "máquinas";
const int COLETOR_ID = 1; // id da linha que este ESP8266 representa

// ---------- SENSOR ----------
const int PINO_TRIG = D1; // GPIO5
const int PINO_ECHO = D2; // GPIO4
const float LIMITE_DISTANCIA_CM = 15.0; // abaixo disso = "cheia"

const unsigned long INTERVALO_LEITURA_MS = 60000; // 1 leitura por minuto
unsigned long ultimaLeitura = 0;
bool ultimoStatusCheio = false;

String accessToken = "";

// ---------- SETUP ----------
void setup() {
  Serial.begin(115200);
  delay(1000);

  configurarSensorUltrassonico();
  conectarWiFi();

  if (!fazerLogin()) {
    Serial.println("❌ Não foi possível autenticar. As atualizações de status vão falhar.");
  }
}

void loop() {
  if (millis() - ultimaLeitura >= INTERVALO_LEITURA_MS) {
    ultimaLeitura = millis();

    bool ocupado = verificarPresenca();
    Serial.println(ocupado ? "Espaço OCUPADO (cheia)" : "Espaço LIVRE (vazio)");

    if (ocupado != ultimoStatusCheio) {
      if (accessToken.length() == 0) {
        fazerLogin(); // tenta logar de novo caso não tenha token ainda
      }
      if (atualizarStatus(ocupado)) {
        ultimoStatusCheio = ocupado;
      }
    }
  }
}

// ---------- WIFI ----------
void conectarWiFi() {
  Serial.print("Conectando ao WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Conectado! IP: ");
  Serial.println(WiFi.localIP());
}

// ---------- 1. CONFIGURAR SENSOR ----------
void configurarSensorUltrassonico() {
  pinMode(PINO_TRIG, OUTPUT);
  pinMode(PINO_ECHO, INPUT);
  digitalWrite(PINO_TRIG, LOW);
}

// ---------- 2. LER SE TEM ALGO NO ESPAÇO ----------
// Retorna true se detectou objeto dentro do limite de distância, false caso contrário
bool verificarPresenca() {
  

  float distanciaCm = 13;
  Serial.printf("Distância medida: %.1f cm\n", distanciaCm);

  return distanciaCm <= LIMITE_DISTANCIA_CM;
}

// ---------- LOGIN (obtém access_token) ----------
bool fazerLogin() {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String url = "https://" + String(SUPABASE_URL) + "/auth/v1/token?grant_type=password";

  if (!http.begin(client, url)) {
    Serial.println("Falha ao iniciar conexão HTTPS (login).");
    return false;
  }

  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> corpo;
  corpo["email"]    = USER_EMAIL;
  corpo["password"] = USER_PASSWORD;

  String corpoJson;
  serializeJson(corpo, corpoJson);

  int codigoHttp = http.POST(corpoJson);
  String resposta = http.getString();
  http.end();

  Serial.print("Login - código HTTP: ");
  Serial.println(codigoHttp);

  if (codigoHttp != 200) {
    Serial.print("Falha no login. Resposta: ");
    Serial.println(resposta);
    return false;
  }

  StaticJsonDocument<2048> respostaJson;
  DeserializationError erro = deserializeJson(respostaJson, resposta);
  if (erro) {
    Serial.print("Erro ao interpretar resposta do login: ");
    Serial.println(erro.c_str());
    return false;
  }

  accessToken = respostaJson["access_token"].as<String>();
  if (accessToken.length() == 0) {
    Serial.println("Login não retornou access_token.");
    return false;
  }

  Serial.println("Login realizado com sucesso!");
  return true;
}

// ---------- 3. MODIFICAR STATUS ----------
bool atualizarStatus(bool ocupado) {
  if (accessToken.length() == 0) {
    Serial.println("Sem access_token — não é possível atualizar o status.");
    return false;
  }

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String url = "https://" + String(SUPABASE_URL) +
               "/rest/v1/" + String(TABELA) +
               "?id=eq." + String(COLETOR_ID);

  if (!http.begin(client, url)) {
    Serial.println("Falha ao iniciar conexão HTTPS (update).");
    return false;
  }

  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", "Bearer " + accessToken); // token do usuário logado
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Prefer", "return=representation");

  const char* status = ocupado ? "cheia" : "vazio";
  int nivel = ocupado ? 100 : 0;

  StaticJsonDocument<256> corpo;
  corpo["status"] = status;
  corpo["nivel"]  = nivel;

  String corpoJson;
  serializeJson(corpo, corpoJson);

  int codigoHttp = http.PATCH(corpoJson);
  String resposta = http.getString();
  http.end();

  Serial.print("Update - código HTTP: ");
  Serial.println(codigoHttp);
  Serial.print("Resposta: ");
  Serial.println(resposta);

  bool statusOk = (codigoHttp == 200 || codigoHttp == 204);
  bool retornouLinha = (resposta.length() > 2); // maior que "[]"

  if (statusOk && !retornouLinha) {
    Serial.println("⚠️ Requisição OK, mas nenhuma linha foi atualizada (RLS pode ter bloqueado).");
  }

  return statusOk && retornouLinha;
}
