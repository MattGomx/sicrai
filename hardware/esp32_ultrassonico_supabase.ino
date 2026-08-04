/*
  Monitoramento de nível de armazenamento com sensor ultrassônico (HC-SR04)
  Envia leituras e alertas para o Supabase via REST API (PostgREST)

  Hardware:
    - ESP32
    - HC-SR04
        VCC  -> 5V
        GND  -> GND
        TRIG -> GPIO 5
        ECHO -> GPIO 18 (usar divisor de tensão 5V -> 3.3V!)

  Fluxo:
    1. Mede a distância até a superfície do material armazenado
    2. Converte em % de nível, com base na altura do reservatório
    3. Envia a leitura para a tabela storage_readings
    4. Se o nível estiver abaixo do limite, envia um registro para a
       tabela alerts (que dispara o envio de e-mail no lado do Supabase)
*/

#include <WiFi.h>
#include <HTTPClient.h>

// ---------- CONFIGURAÇÕES ----------
const char* WIFI_SSID     = "SEU_WIFI";
const char* WIFI_PASSWORD = "SUA_SENHA";

const char* SUPABASE_URL      = "https://SEU_PROJETO.supabase.co";
const char* SUPABASE_ANON_KEY = "SUA_ANON_KEY";

const char* DEVICE_ID = "tanque-01"; // identifica o sensor/reservatório

// Distâncias de calibração (cm) — ajuste para o seu reservatório
const float DIST_TANQUE_CHEIO  = 10.0;  // distância sensor->superfície quando cheio
const float DIST_TANQUE_VAZIO  = 100.0; // distância sensor->superfície quando vazio

const float LIMITE_ALERTA_PERCENT = 20.0; // dispara alerta abaixo disso

const int PINO_TRIG = 5;
const int PINO_ECHO = 18;

const unsigned long INTERVALO_LEITURA_MS = 60000; // 1 leitura por minuto
unsigned long ultimaLeitura = 0;

bool alertaJaEnviado = false; // evita reenviar alerta repetidamente

// ---------- SETUP ----------
void setup() {
  Serial.begin(115200);
  pinMode(PINO_TRIG, OUTPUT);
  pinMode(PINO_ECHO, INPUT);

  conectarWiFi();
}

void loop() {
  if (millis() - ultimaLeitura >= INTERVALO_LEITURA_MS) {
    ultimaLeitura = millis();

    float distancia = medirDistanciaCm();
    if (distancia <= 0) {
      Serial.println("Leitura inválida do sensor.");
      return;
    }

    float nivelPercent = calcularNivelPercent(distancia);
    Serial.printf("Distância: %.1f cm | Nível: %.1f%%\n", distancia, nivelPercent);

    enviarLeitura(distancia, nivelPercent);

    if (nivelPercent <= LIMITE_ALERTA_PERCENT) {
      if (!alertaJaEnviado) {
        enviarAlerta(nivelPercent);
        alertaJaEnviado = true;
      }
    } else {
      alertaJaEnviado = false; // reseta quando o nível volta ao normal
    }
  }
}

// ---------- WIFI ----------
void conectarWiFi() {
  Serial.printf("Conectando ao WiFi %s...\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi conectado!");
}

// ---------- SENSOR ----------
float medirDistanciaCm() {
  digitalWrite(PINO_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PINO_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PINO_TRIG, LOW);

  long duracao = pulseIn(PINO_ECHO, HIGH, 30000); // timeout 30ms
  if (duracao == 0) return -1;

  return duracao * 0.0343 / 2.0; // cm
}

float calcularNivelPercent(float distanciaCm) {
  float nivel = 100.0 * (DIST_TANQUE_VAZIO - distanciaCm) /
                (DIST_TANQUE_VAZIO - DIST_TANQUE_CHEIO);
  if (nivel < 0) nivel = 0;
  if (nivel > 100) nivel = 100;
  return nivel;
}

// ---------- SUPABASE ----------
void enviarLeitura(float distanciaCm, float nivelPercent) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/storage_readings";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);

  String payload = String("{\"device_id\":\"") + DEVICE_ID +
                    "\",\"distance_cm\":" + String(distanciaCm, 1) +
                    ",\"level_percent\":" + String(nivelPercent, 1) + "}";

  int codigo = http.POST(payload);
  Serial.printf("POST storage_readings -> HTTP %d\n", codigo);
  http.end();
}

void enviarAlerta(float nivelPercent) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/alerts";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);

  String mensagem = "Nivel critico: " + String(nivelPercent, 1) + "% no dispositivo " + DEVICE_ID;

  String payload = String("{\"device_id\":\"") + DEVICE_ID +
                    "\",\"level_percent\":" + String(nivelPercent, 1) +
                    ",\"message\":\"" + mensagem +
                    "\",\"status\":\"pending\"}";

  int codigo = http.POST(payload);
  Serial.printf("POST alerts -> HTTP %d\n", codigo);
  http.end();
}
