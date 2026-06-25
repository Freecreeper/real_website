from pathlib import Path
import importlib.util

ROOT_SERVER = Path(__file__).resolve().parents[1] / "server.py"
spec = importlib.util.spec_from_file_location("the_button_server", ROOT_SERVER)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

app = module.app
socketio = module.socketio

if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        allow_unsafe_werkzeug=True
    )
