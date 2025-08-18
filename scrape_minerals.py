import requests
from bs4 import BeautifulSoup
import json
import time

BASE_URL = "https://prospecting.fandom.com"
MINERALS_URL = BASE_URL + "/wiki/Minerals"


def get_soup(url):
    res = requests.get(url)
    res.raise_for_status()
    return BeautifulSoup(res.text, "html.parser")


def scrape_locations(mineral_url):
    """ดึงข้อมูล Locations & Chances จากหน้าของแร่"""
    soup = get_soup(mineral_url)
    locations = []
    drop_chances = {}

    # หา section ที่เป็น Locations
    headers = soup.find_all(["h2", "h3"])
    for h in headers:
        if "Locations" in h.get_text():
            # หาข้อมูลหลัง heading นี้
            next_element = h.find_next_sibling()
            while next_element:
                if next_element.name == "ul":
                    # ดึงข้อมูลจาก list
                    for li in next_element.find_all("li"):
                        text = li.get_text(strip=True)
                        # แยก location และ chance (ถ้ามี)
                        if "(" in text and "%" in text:
                            parts = text.split("(")
                            loc = parts[0].strip()
                            chance = "(" + parts[1] if len(parts) > 1 else ""
                            locations.append(loc)
                            drop_chances[loc] = chance
                        else:
                            locations.append(text)
                    break
                elif next_element.name in ["h2", "h3"]:
                    break
                next_element = next_element.find_next_sibling()
            break

    # หาจาก infobox ถ้าไม่เจอ
    if not locations:
        infobox = soup.find("table", {"class": "infobox"})
        if infobox:
            rows = infobox.find_all("tr")
            for row in rows:
                th = row.find("th")
                if th and "Locations" in th.get_text():
                    td = row.find("td")
                    if td:
                        for li in td.find_all("li"):
                            text = li.get_text(strip=True)
                            locations.append(text)

    return locations, drop_chances


def scrape_minerals():
    soup = get_soup(MINERALS_URL)
    minerals = []

    # หาแท็บแต่ละ rarity จาก tabber
    tabber = soup.find("div", {"class": "tabber wds-tabber"})
    if not tabber:
        print("❌ ไม่พบ tabber element")
        return minerals

    # หา tab content ทั้งหมด
    tab_contents = tabber.find_all("div", {"class": "wds-tab__content"})
    tab_labels = tabber.find_all("li", {"class": "wds-tabs__tab"})
    
    for i, tab_content in enumerate(tab_contents):
        # หา rarity จาก tab label
        rarity = "Unknown"
        if i < len(tab_labels):
            rarity_elem = tab_labels[i].find("a")
            if rarity_elem:
                rarity = rarity_elem.get_text(strip=True)

        print(f"🔍 Processing {rarity} minerals...")

        # หาตารางในแต่ละ tab
        table = tab_content.find("table", {"class": "fandom-table"})
        if not table:
            print(f"⚠️ ไม่พบตารางใน {rarity} tab")
            continue

        rows = table.find_all("tr")[1:]  # ข้ามหัวตาราง

        for row in rows:
            cols = row.find_all("td")
            if len(cols) < 5:  # ต้องมีอย่างน้อย 5 คอลัมน์
                continue

            # Columns: [Name, Appearance, $/kg, Collection description, Available Locations]
            name_cell = cols[0]
            value_cell = cols[2]
            description_cell = cols[3]
            locations_cell = cols[4]

            # ดึงชื่อและ URL
            link = name_cell.find("a")
            name = link.text.strip() if link else name_cell.get_text(strip=True)
            url = BASE_URL + link["href"] if link else None

            # ดึงราคา
            value = value_cell.get_text(strip=True)

            # ดึง description
            description = description_cell.get_text(strip=True)

            # ดึง locations จากตาราง
            table_locations = []
            for loc_link in locations_cell.find_all("a"):
                table_locations.append(loc_link.get_text(strip=True))
            
            if not table_locations:
                table_locations = [locations_cell.get_text(strip=True)]

            # ดึงข้อมูลเพิ่มเติมจากหน้าของแร่
            detailed_locations, drop_chances = ([], {})
            if url:
                try:
                    detailed_locations, drop_chances = scrape_locations(url)
                    time.sleep(0.5)  # กัน block
                except Exception as e:
                    print(f"⚠️ Error scraping {name}: {e}")

            # ใช้ข้อมูลจากหน้าแร่ถ้ามี ไม่งั้นใช้จากตาราง
            final_locations = detailed_locations if detailed_locations else table_locations

            mineral = {
                "name": name,
                "rarity": rarity,
                "value": value,
                "description": description,
                "locations": final_locations,
                "dropChances": drop_chances,
                "url": url
            }
            print(f'✅ Got data for {mineral}')
            minerals.append(mineral)

    return minerals


if __name__ == "__main__":
    minerals = scrape_minerals()
    with open("minerals.json", "w", encoding="utf-8") as f:
        json.dump(minerals, f, indent=2, ensure_ascii=False)
    print(json.dumps(minerals, indent=2, ensure_ascii=False))
