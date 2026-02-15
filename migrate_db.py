import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Local database
local_conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="springais",  # ← Changed from "skillbridge"
    user="postgres",
    password="postgres"
)

# Remote database (get from DigitalOcean)
remote_conn = psycopg2.connect(os.getenv("DIGITALOCEAN_DATABASE_URL"))

# Tables to migrate (in order due to foreign keys)
tables = [
    'users',
    'badge_catalog',
    'achievement_catalog',
    'side_quest_catalog',
    'cosmetic_catalog',
    'user_badges',
    'user_achievements',
    'user_quests',
    'user_cosmetics',
    'user_skills',
]

for table in tables:
    print(f"Migrating {table}...")
    
    try:
        # Read from local
        local_cur = local_conn.cursor()
        local_cur.execute(f"SELECT * FROM {table}")
        rows = local_cur.fetchall()
        
        if not rows:
            print(f"  ⚠️  No data in {table}, skipping...")
            continue
            
        columns = [desc[0] for desc in local_cur.description]
        
        # Write to remote
        remote_cur = remote_conn.cursor()
        success_count = 0
        
        for row in rows:
            try:
                placeholders = ','.join(['%s'] * len(row))
                insert_sql = f"INSERT INTO {table} ({','.join(columns)}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
                remote_cur.execute(insert_sql, row)
                success_count += 1
            except Exception as e:
                print(f"  ❌ Error inserting row: {e}")
                continue
        
        remote_conn.commit()
        print(f"  ✓ Migrated {success_count}/{len(rows)} rows from {table}")
        
    except Exception as e:
        print(f"  ❌ Error migrating {table}: {e}")
        continue

print("\n✅ Migration complete!")
local_conn.close()
remote_conn.close()