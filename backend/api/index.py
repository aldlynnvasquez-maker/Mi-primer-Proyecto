from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os


app = Flask(__name__)
CORS(app)

def cargar_datos():
    # Aseguramos que la ruta funcione en local y en Vercel
    base_path = os.path.dirname(os.path.abspath(__file__))
    ruta_json = os.path.join(base_path, 'data', 'candidatos.json')
    
    with open(ruta_json, 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def home():
    return "API de Votación Funcionando"

@app.route('/api/candidatos', methods=['GET'])
def get_candidatos():
    try:
        data = cargar_datos()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": f"Error interno: {str(e)}"}), 500

@app.route('/api/votar', methods=['POST'])
def votar():
    try:
        voto = request.json
        # Aquí iría la lógica para guardar en base de datos
        print(f"Voto recibido para: {voto.get('partido_id')}")
        return jsonify({"message": "Voto registrado correctamente", "status": "success"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500