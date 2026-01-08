from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from data.bd import obtener_usuario
from data.bd import obtener_usuario_voto
from data.bd import guardar_votante

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

@app.route('/api/usuario', methods=['GET'])
def get_usuario():
    dni = request.args.get('dni',type=int)
    if dni is None:
        return jsonify({'Error': 'Falta el parámetro dni'}), 400
    try:
        usuairo_df = obtener_usuario(dni)
        obtener_votante_df = obtener_usuario_voto(dni)
        
        if usuairo_df.empty:
            return jsonify({'Error': 'Usuario no encontrado'}), 404
        
        if not obtener_votante_df.empty:
            return jsonify({'Error': 'El usuario ya ha votado'}), 404   
        
        return jsonify(usuairo_df.to_dict(orient='records')[0])
    
    except Exception as e:
        return jsonify({'Error': f'Error interno: {str(e)}'}), 500
    

@app.route('/api/candidatos', methods=['GET'])
def get_candidatos():
    try:
        data = cargar_datos()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": f"Error interno: {str(e)}"}), 500

@app.route('/api/votar', methods=['POST'])
def votar():
    data = request.json

    voto = data.get("id_voto")
    dni = data.get("dni")
    presidente = data.get("presidente")
    vicepresidente = data.get("vicepresidente")
    diputado = data.get("diputado")
    parlamentario = data.get("parlamentario")
    senador = data.get("senador")
    
    print(f"Datos recibidos: DNI={dni}, Presidente={presidente}, Vice={vicepresidente}, Diputado={diputado}, Parlamentario={parlamentario}, Senador={senador}")

    if not dni:
        return jsonify({"error": "Usuario no identificado"}), 400

    if not all([presidente, vicepresidente, diputado, parlamentario, senador]):
        return jsonify({"error": "Debe votar en todas las categorías"}), 400

    try:
        guardar_votante(voto, dni, presidente, vicepresidente, diputado, parlamentario, senador)
        return jsonify({
            "message": "Voto registrado correctamente",
            "status": "success"
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Error al registrar el voto",
            "detail": str(e)
        }), 500