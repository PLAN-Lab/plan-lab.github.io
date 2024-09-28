import os
import json
import requests
import yaml
from urllib.parse import quote
from datetime import datetime
import pandas as pd

sheet_id = '1Kom-9Hv76j30AI9NRpz51B4klHOdctH2sm6hVGtl2ow'
base = f'https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?'
# https://docs.google.com/spreadsheets/d/1Kom-9Hv76j30AI9NRpz51B4klHOdctH2sm6hVGtl2ow/gviz/tq?

sheet_name = 'user-data'
query = quote('Select *')
url = f'{base}&sheet=${sheet_name}&tq={query}'

print(url)

x = requests.get(url)
sheets_data = json.loads('('.join(x.text.split('\n')[1].split('(')[1:])[:-2])

for idx, row in enumerate(sheets_data['table']['rows']):
    vals = row['c']
    new_dict = {}
    name = vals[1]['v'] if vals[1] is not None else ' '
    image_path = vals[2]['v'] if vals[2] is not None else ' '
    country = vals[3]['v'] if vals[3] is not None else ' '
    description = vals[4]['v'] if vals[4] is not None else ' '
    role = vals[5]['v'] if vals[5] is not None else ' '
    website = vals[6]['v'] if vals[6] is not None else ' '
    email = vals[7]['v'] if vals[7] is not None else ' '
    github_username = vals[8]['v'] if vals[8] is not None else ' '
    scholar_id = vals[9]['v'] if vals[9] is not None else ' '
    linkedin_username = vals[10]['v'] if vals[10] is not None else ' '
    twitter_username = vals[11]['v'] if vals[11] is not None else ' '
    link_to_cv = vals[12]['v'] if vals[12] is not None else ' '
    about_me = vals[13]['v'] if vals[13] is not None else ' '
    
    print(name.split(' '))
    first_name, last_name = name.split(' ')[0], name.split(' ')[1]
    alias_2 = f'{first_name[0]} {last_name}'
    alias_3 = f'{first_name[0]}. {last_name}'
    
    # start long string named file_content
    file_content = f'''---
name: {name}
image: {image_path}
description: {description}
role: {role}
aliases:
    - {name}
    - {alias_2}
    - {alias_3}
links: 
    home-page: {website}
    email: {email}
    github: {github_username}
    google-scholar: {scholar_id}
---

{about_me}'''
    
    # dump file contents to a file
    filename = f'{first_name.lower()}-{last_name.lower()}.md'
    filepath = os.path.join('_members', filename)
    with open(filepath, 'w') as f:
        f.write(file_content)
