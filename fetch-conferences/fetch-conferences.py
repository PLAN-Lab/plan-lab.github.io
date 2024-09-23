import json
import requests
import yaml
from urllib.parse import quote
from datetime import datetime
import pandas as pd

# sheet_id = '1dzx8QSiBQFcUOQTPa_uI64OCGQqESWtrq6EwqOVngZw'
# sheet_id = '1z49Gu0j6Lc6AcZjyjDR6BGUgcjEuTqcO5Vxp8ZCAZxM'
sheet_id = '1Z-uP86zVn0huoLXRPo9SI3klV11BQgfk'
base = f'https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?'
# https://docs.google.com/spreadsheets/d/1dzx8QSiBQFcUOQTPa_uI64OCGQqESWtrq6EwqOVngZw/gviz/tq?

sheet_name = 'user-data'
query = quote('Select *')
url = f'{base}&sheet=${sheet_name}&tq={query}'

print(url)

x = requests.get(url)
sheets_data = json.loads('('.join(x.text.split('\n')[1].split('(')[1:])[:-2])

conf_list = []
passed_conflist = []
na_conflist = []

for idx, row in enumerate(sheets_data['table']['rows']):
    vals = row['c']
    new_dict = {}
    if idx == 0:
        continue
    
    if vals[1] is None:
        if vals[2] is None:
            new_dict['title'] = None
        else:
            new_dict['title'] = f'{vals[2]["v"]}'
    else:
        if vals[2] is None:
            new_dict['title'] = f'{vals[1]["v"]}'
        else:
            new_dict['title'] = f'{vals[2]["v"]} ({vals[1]["v"]})'
            
    new_dict['h5-index'] = vals[4]['f'] if vals[4] is not None else 'N/A'
    new_dict['core-ranking'] = vals[5]["v"] if vals[5] is not None else '-'
    new_dict['call-for-papers'] = vals[8]["v"] if vals[8] is not None else '-'
    new_dict['abstract-deadline'] = vals[9]['v'] if vals[9] is not None else '-'
    # Convert date string
    if vals[10] is not None:
        y, m, d = vals[10]['v'][5:-1].split(',')
        ymd = datetime(int(y), int(m)+1, int(d))
        date_string = ymd.strftime('%b %d %Y')
    else:
        date_string = 'TBA'
    new_dict['submission-deadline'] = date_string
    new_dict['rebuttal-starts'] = vals[11]['v'] if vals[11] is not None else '-'
    new_dict['notification-date'] = vals[12]['v'] if vals[12] is not None else '-'
    new_dict['conference-date'] = vals[13]['v'] if vals[13] is not None else '-'
    new_dict['conference-location'] = vals[14]['v'] if vals[14] is not None else '-'
    new_dict['tags'] = vals[15]['v'].split(',') if vals[15] is not None else '-'
    # new_dict['acceptance-rate-2022'] = vals[15]['v'] if vals[15] is not None else '-'
    # new_dict['acceptance-rate-2021'] = vals[16]['v'] if vals[16] is not None else '-'
    # new_dict['acceptance-rate-2020'] = vals[17]['v'] if vals[17] is not None else '-'
    # new_dict['acceptance-rate-2019'] = vals[18]['v'] if vals[18] is not None else '-'
    new_dict['sd-for-sorting'] = ymd
    
    today = datetime.now()
    if date_string != 'TBA':
        if ymd < today:
            passed_conflist.append(new_dict)
        else:
            conf_list.append(new_dict)
    else:
        na_conflist.append(new_dict)

conf_list = sorted(conf_list, key=lambda d: d['sd-for-sorting'])
passed_conflist = sorted(passed_conflist, key=lambda d: d['sd-for-sorting'], reverse=True)

    
f = open('./_data/conferences.yaml', 'w')
yaml.dump(conf_list, f)
f.close()

f = open('./_data/conferences_passed.yaml', 'w')
yaml.dump(passed_conflist, f)
f.close()

f = open('./_data/conferences_na.yaml', 'w')
yaml.dump(na_conflist, f)
f.close()