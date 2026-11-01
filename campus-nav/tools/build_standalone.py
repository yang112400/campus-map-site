# -*- coding: utf-8 -*-
"""把 3d.html + vendor/three.min.js + vendor/OrbitControls.js + assets/b-building-data.js
打包成一个自包含的 HTML（单文件，双击即开）。"""
import os

ROOT = r"C:\Users\王\Desktop\11.1\demo"
html = open(os.path.join(ROOT, "3d.html"), "r", encoding="utf-8").read()
three = open(os.path.join(ROOT, "vendor", "three.min.js"), "r", encoding="utf-8").read()
orbit = open(os.path.join(ROOT, "vendor", "OrbitControls.js"), "r", encoding="utf-8").read()
data = open(os.path.join(ROOT, "assets", "b-building-data.js"), "r", encoding="utf-8").read()

repls = [
    ('<script src="vendor/three.min.js"></script>', "<script>\n" + three + "\n</script>"),
    ('<script src="vendor/OrbitControls.js"></script>', "<script>\n" + orbit + "\n</script>"),
    ('<script src="assets/b-building-data.js"></script>', "<script>\n" + data + "\n</script>"),
]
for old, new in repls:
    if old not in html:
        raise SystemExit("missing marker: " + old)
    html = html.replace(old, new, 1)

out = os.path.join(ROOT, "3d-standalone.html")
open(out, "w", encoding="utf-8").write(html)
print("saved", out, len(html), "chars")
