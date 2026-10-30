#!/usr/bin/env python3
"""Llena mis_comidas/{numEmp} (resumen de comidas por quincena de cada colaborador) a partir de
historial/{quincena}. Se corre una vez al publicar el cambio de privacidad del historial; despues la
pagina lo mantiene al archivar. Usa la sesion de gcloud (Cloud Shell), no los PIN.

  python3 setup/llenar_mis_comidas.py            # modo prueba: solo muestra lo que haria
  python3 setup/llenar_mis_comidas.py --aplicar  # escribe los resumenes
"""
import json, subprocess, sys, urllib.request
from datetime import datetime, timezone

PROYECTO = "menu-proesa-yama"
BASE = f"https://firestore.googleapis.com/v1/projects/{PROYECTO}/databases/(default)/documents"
APLICAR = "--aplicar" in sys.argv
TOKEN = subprocess.check_output(["gcloud", "auth", "print-access-token"]).decode().strip()


def pedir(metodo, url, cuerpo=None):
    r = urllib.request.Request(url, method=metodo, data=json.dumps(cuerpo).encode() if cuerpo else None,
                               headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(r))


def doc_id(num):  # igual que orderDocId() en index.html
    return str(num).strip().upper().lstrip("0") or "0"


resumen = {}
token = ""
while True:
    d = pedir("GET", f"{BASE}/historial?pageSize=100" + (f"&pageToken={token}" if token else ""))
    for doc in d.get("documents", []):
        q = doc["name"].split("/")[-1]
        for emp, v in doc.get("fields", {}).items():
            if emp.startswith("_"):
                continue
            comidas = int(v.get("mapValue", {}).get("fields", {}).get("comidas", {}).get("integerValue", "0"))
            r = resumen.setdefault(doc_id(emp), {})
            r[q] = r.get(q, 0) + comidas
    token = d.get("nextPageToken")
    if not token:
        break

print(f"{len(resumen)} colaboradores con historial")
for emp in sorted(resumen, key=lambda e: (len(e), e))[:5]:
    print(f"  ejemplo #{emp}: {resumen[emp]}")
if not APLICAR:
    print("MODO PRUEBA: no se cambio nada. Para aplicar: python3 setup/llenar_mis_comidas.py --aplicar")
    sys.exit(0)
ahora = datetime.now(timezone.utc).isoformat()
for emp, quincenas in resumen.items():
    pedir("PATCH", f"{BASE}/mis_comidas/{emp}", {"fields": {
        "quincenas": {"mapValue": {"fields": {q: {"integerValue": str(c)} for q, c in quincenas.items()}}},
        "actualizado": {"stringValue": ahora}}})
print(f"Aplicado: {len(resumen)} resumenes escritos en mis_comidas.")
