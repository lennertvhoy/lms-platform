import os
import logging
import pyodbc
import requests
import xml.etree.ElementTree as ET
import azure.functions as func

# Load database connection string from environment
DB_CONN_STR = os.environ.get('DATABASE_URL')

def main(mytimer: func.TimerRequest) -> None:
    logging.info('UpdateContentFunction triggered')
    # Connect to SQL Server via ODBC
    conn = pyodbc.connect(DB_CONN_STR)
    cursor = conn.cursor()

    feeds = [
        {"name": "Azure Updates", "url": "https://azurecomcdn.azureedge.net/en-us/updates/feed/", "tag": "Azure"},
        {"name": "AzureAD Blog", "url": "https://techcommunity.microsoft.com/feed.xml?board.id=azure-activedirectory", "tag": "AzureAD"}
    ]

    # Ensure table exists
    cursor.execute("""
        IF OBJECT_ID('dbo.Updates', 'U') IS NULL
        CREATE TABLE dbo.Updates (
          Id UNIQUEIDENTIFIER DEFAULT NEWID() PRIMARY KEY,
          FeedName NVARCHAR(200),
          Title NVARCHAR(500),
          Link NVARCHAR(1000),
          Published DATETIME,
          Tag NVARCHAR(100)
        )
    """)
    conn.commit()

    for feed in feeds:
        try:
            resp = requests.get(feed['url'], timeout=10)
            root = ET.fromstring(resp.content)
            for item in root.findall('.//item'):
                title = item.findtext('title')
                link = item.findtext('link')
                pubdate = item.findtext('pubDate')
                guid = item.findtext('guid') or link
                # Check if exists
                cursor.execute("SELECT COUNT(1) FROM dbo.Updates WHERE Link = ?", guid)
                exists = cursor.fetchone()[0]
                if exists == 0:
                    cursor.execute(
                        "INSERT INTO dbo.Updates (FeedName, Title, Link, Published, Tag) VALUES (?, ?, ?, ?, ?)",
                        feed['name'], title, link, pubdate, feed['tag']
                    )
                    logging.info(f'Inserted update: {title}')
            conn.commit()
        except Exception as e:
            logging.error(f'Error processing feed {feed["name"]}: {e}')

    cursor.close()
    conn.close()
    logging.info('UpdateContentFunction completed') 