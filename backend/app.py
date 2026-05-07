# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from scheduler import run_scheduler # scheduler.py에서 함수 불러오기

app = Flask(__name__)
CORS(app) # 프론트엔드 통신 허용

@app.route('/api/simulate', methods=['POST'])
def simulate():
    try:
        data = request.json
        processes = data.get('processes', [])
        core_types = data.get('core_types', ['P'])
        algorithm = data.get('algorithm', 'FCFS')
        tq = data.get('time_quantum', 2)
        k = data.get('k_threshold', 3)

        p_core_count = core_types.count('P')
        e_core_count = core_types.count('E')

        # 프론트에서 보낸 데이터를 run_scheduler 함수에 전달
        result = run_scheduler(
            process_input_list=processes,
            p_core_count=p_core_count,
            e_core_count=e_core_count,
            algorithm_name=algorithm,
            time_quantum=tq,
            k_threshold=k
        )
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    # 포트 5000번에서 서버 실행
    app.run(host='127.0.0.1', port=5000, debug=False)