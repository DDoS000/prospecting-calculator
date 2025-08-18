# Mining Game Data Viewer

เว็บแอปพลิเคชันสำหรับดูข้อมูลเกม Mining และคำนวณ Materials ที่ต้องใช้ในการ Craft Equipment

## Features

- 🛠️ **Equipment & Crafting**: ดูข้อมูล Equipment และ Materials ที่ต้องใช้
- 🧮 **Material Calculator**: คำนวณ Materials ที่ต้องใช้สำหรับ Craft Equipment หลายชิ้น
- 💎 **Ores & Minerals**: ดูข้อมูล Ores และตำแหน่งที่หาได้
- 🗺️ **Mining Zones**: ดูข้อมูล Zones และความยากในการขุด

## การ Deploy ขึ้น GitHub Pages

### ขั้นตอนที่ 1: Push โค้ดขึ้น GitHub

```bash
git add .
git commit -m "Convert to static site for GitHub Pages"
git push origin main
```

### ขั้นตอนที่ 2: เปิดใช้งาน GitHub Pages

1. ไปที่ Repository ของคุณบน GitHub
2. คลิกที่ **Settings** tab
3. เลื่อนลงไปหา **Pages** ในเมนูด้านซ้าย
4. ใน **Source** เลือก **GitHub Actions**
5. GitHub Actions จะทำงานอัตโนมัติและ deploy เว็บไซต์ให้

### ขั้นตอนที่ 3: เข้าถึงเว็บไซต์

หลังจาก deploy เสร็จแล้ว เว็บไซต์จะสามารถเข้าถึงได้ที่:
```
https://[username].github.io/[repository-name]
```

## การพัฒนาในเครื่อง

หากต้องการทดสอบในเครื่อง สามารถใช้ HTTP server ง่ายๆ:

```bash
# ใช้ Python
python -m http.server 8000 --directory public

# หรือใช้ Node.js
npx http-server public -p 8000
```

จากนั้นเปิดเบราว์เซอร์ไปที่ `http://localhost:8000`

## โครงสร้างไฟล์

```
public/
├── index.html      # หน้าหลัก
├── script.js       # JavaScript สำหรับ functionality
├── style.css       # CSS สำหรับ styling
└── data.json       # ข้อมูล Equipment, Ores, และ Zones
```

## การอัพเดทข้อมูล

หากต้องการอัพเดทข้อมูล:
1. แก้ไขไฟล์ `public/data.json`
2. Commit และ Push ขึ้น GitHub
3. GitHub Actions จะ deploy อัตโนมัติ