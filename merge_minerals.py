#!/usr/bin/env python3
"""
Script to merge detailed mineral data from minerals.json into all.json
"""

import json

def load_json_file(filename):
    """Load JSON data from file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: {filename} not found")
        return None
    except json.JSONDecodeError as e:
        print(f"Error parsing {filename}: {e}")
        return None

def merge_mineral_data(all_data, minerals_data):
    """Merge detailed mineral data into all.json structure"""
    if not all_data or not minerals_data:
        return None
    
    # Create a lookup dictionary for minerals data
    minerals_lookup = {mineral['name']: mineral for mineral in minerals_data}
    
    # Update minerals in all_data
    updated_minerals = []
    
    for mineral in all_data['minerals']:
        mineral_name = mineral['name']
        
        if mineral_name in minerals_lookup:
            # Merge data from minerals.json
            detailed_mineral = minerals_lookup[mineral_name].copy()
            
            # Keep the original structure but add new fields
            updated_mineral = {
                'name': mineral['name'],
                'rarity': mineral['rarity'],
                'locations': mineral['locations']
            }
            
            # Add new fields from minerals.json
            if 'value' in detailed_mineral:
                updated_mineral['value'] = detailed_mineral['value']
            if 'description' in detailed_mineral:
                updated_mineral['description'] = detailed_mineral['description']
            if 'dropChances' in detailed_mineral:
                updated_mineral['dropChances'] = detailed_mineral['dropChances']
            if 'url' in detailed_mineral:
                updated_mineral['url'] = detailed_mineral['url']
                
            updated_minerals.append(updated_mineral)
        else:
            # Keep original mineral data if not found in minerals.json
            updated_minerals.append(mineral)
    
    # Add any minerals from minerals.json that aren't in all.json
    existing_names = {mineral['name'] for mineral in all_data['minerals']}
    for mineral_name, mineral_data in minerals_lookup.items():
        if mineral_name not in existing_names:
            new_mineral = {
                'name': mineral_data['name'],
                'rarity': mineral_data['rarity'],
                'locations': mineral_data['locations']
            }
            
            if 'value' in mineral_data:
                new_mineral['value'] = mineral_data['value']
            if 'description' in mineral_data:
                new_mineral['description'] = mineral_data['description']
            if 'dropChances' in mineral_data:
                new_mineral['dropChances'] = mineral_data['dropChances']
            if 'url' in mineral_data:
                new_mineral['url'] = mineral_data['url']
                
            updated_minerals.append(new_mineral)
    
    # Sort minerals by rarity and then by name
    rarity_order = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical', 'Mythic', 'Exotic']
    
    def sort_key(mineral):
        rarity = mineral.get('rarity', 'Unknown')
        rarity_index = rarity_order.index(rarity) if rarity in rarity_order else len(rarity_order)
        return (rarity_index, mineral['name'])
    
    updated_minerals.sort(key=sort_key)
    
    # Update the all_data structure
    all_data['minerals'] = updated_minerals
    
    return all_data

def save_json_file(data, filename):
    """Save JSON data to file"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving {filename}: {e}")
        return False

def main():
    print("Loading data files...")
    
    # Load the data files
    all_data = load_json_file('data/all.json')
    minerals_data = load_json_file('minerals.json')
    
    if not all_data or not minerals_data:
        print("Failed to load required data files")
        return
    
    print(f"Loaded {len(all_data['minerals'])} minerals from all.json")
    print(f"Loaded {len(minerals_data)} minerals from minerals.json")
    
    # Merge the data
    print("Merging mineral data...")
    merged_data = merge_mineral_data(all_data, minerals_data)
    
    if not merged_data:
        print("Failed to merge data")
        return
    
    print(f"Merged data contains {len(merged_data['minerals'])} minerals")
    
    # Save the updated data
    print("Saving updated all.json...")
    if save_json_file(merged_data, 'data/all.json'):
        print("Successfully updated data/all.json with detailed mineral information!")
        
        # Print summary of added fields
        minerals_with_values = sum(1 for m in merged_data['minerals'] if 'value' in m)
        minerals_with_descriptions = sum(1 for m in merged_data['minerals'] if 'description' in m)
        minerals_with_drop_chances = sum(1 for m in merged_data['minerals'] if 'dropChances' in m)
        minerals_with_urls = sum(1 for m in merged_data['minerals'] if 'url' in m)
        
        print(f"\nSummary:")
        print(f"- {minerals_with_values} minerals now have value information")
        print(f"- {minerals_with_descriptions} minerals now have descriptions")
        print(f"- {minerals_with_drop_chances} minerals now have drop chance data")
        print(f"- {minerals_with_urls} minerals now have wiki URLs")
    else:
        print("Failed to save updated data")

if __name__ == "__main__":
    main()