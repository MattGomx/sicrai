import sys
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image

IMG_SIZE = (224, 224)

def prever(caminho_imagem, modelo_path="classificador_latinha.keras"):
    modelo = load_model(modelo_path)

    img = image.load_img(caminho_imagem, target_size=IMG_SIZE)
    img_array = image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    pred = modelo.predict(img_array)[0][0]

    # Lembrete: no treino, class_indices mostrou {'latinha': 0, 'nao_latinha': 1}
    # então valores próximos de 0 = latinha, próximos de 1 = não-latinha
    if pred < 0.5:
        print(f"É LATINHA (confiança: {(1 - pred) * 100:.1f}%)")
    else:
        print(f"NÃO é latinha (confiança: {pred * 100:.1f}%)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Uso: python prever_latinha.py caminho/da/imagem.jpg")
        sys.exit(1)

    prever(sys.argv[1])