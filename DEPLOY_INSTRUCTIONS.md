# วิธีการ Deploy ขึ้น GitHub Pages

## สิ่งที่ได้เตรียมไว้แล้ว

✅ แปลง project เป็น static site แล้ว  
✅ ย้ายข้อมูลไปใน `public/data.json`  
✅ แก้ไข JavaScript ให้โหลดข้อมูลจาก static file  
✅ สร้าง GitHub Actions workflow  
✅ ทดสอบการทำงานในเครื่องแล้ว  

## ขั้นตอนการ Deploy

### 1. Push โค้ดขึ้น GitHub

```bash
git add .
git commit -m "Convert to static site for GitHub Pages deployment"
git push origin main
```

### 2. เปิดใช้งาน GitHub Pages

1. ไปที่ Repository บน GitHub
2. คลิก **Settings** tab
3. เลื่อนลงไปหา **Pages** ในเมนูซ้าย
4. ใน **Source** เลือก **GitHub Actions**
5. รอให้ GitHub Actions ทำงานเสร็จ (ประมาณ 1-2 นาที)

### 3. เข้าถึงเว็บไซต์

เว็บไซต์จะพร้อมใช้งานที่:
```
https://[your-username].github.io/[repository-name]
```

## การทดสอบในเครื่อง

หากต้องการทดสอบก่อน deploy:

```bash
# ใช้ Python
python -m http.server 8000 --directory public

# หรือใช้ Node.js
npx http-server public -p 8000
```

จากนั้นเปิด `http://localhost:8000`

## หมายเหตุ

- ไฟล์ `server.js`, `package.json` และ folder `node_modules` ไม่จำเป็นสำหรับ static site
- ข้อมูลทั้งหมดอยู่ใน `public/data.json` แล้ว
- GitHub Actions จะ deploy เฉพาะ folder `public` เท่านั้น