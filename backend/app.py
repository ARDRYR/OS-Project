# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from scheduler import run_scheduler # scheduler.py에서 함수 불러오기

import os

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
    # 포트 설정을 환경 변수에서 읽어오도록 수정 (배포 환경 대응)
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)