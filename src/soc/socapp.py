from collections import OrderedDict
import flask
import os
import sqlite3

app = flask.Flask(__name__)


def _dictify_row(cursor, row):
    """Turns the given row into a dictionary where the keys are the column names"""
    d = OrderedDict()
    for i, col in enumerate(cursor.description):
        #d[col[0]] = row[i].decode('utf-8') if type(row[i]) == str else row[i]
        d[col[0]] = row[i]
    return d


def dictify_cursor(cursor):
    """converts all cursor rows into dictionaries where the keys are the column names"""
    return (_dictify_row(cursor, row) for row in cursor)


def get_db_connection():
    d = os.path.dirname(os.path.realpath(__file__))
    dbPath = os.path.join(d, '..', '..', 'soc_data', 'soc_data.db')
    if os.path.exists(dbPath):
        return sqlite3.connect(dbPath)
    else:
        raise Exception(dbPath + ' not found')


@app.route('/study/<curated_study_number>.html')
def study_html(curated_study_number):
    dbCon = get_db_connection()
    c = dbCon.cursor()
    c.execute(
        '''SELECT * FROM studies WHERE curated_study_number=?''',
        (curated_study_number, ),
    )
    study = _dictify_row(c, next(c))
    study_number = study.items()[0][1]

    c.execute(
        '''SELECT * FROM treatments WHERE study_number=? ORDER BY CAST(treatment_day AS FLOAT)''',
        (study_number, ),
    )
    treatments = list(dictify_cursor(c))
    for treatment in treatments:
        # TODO we may want to update these types in the DB so that they're not just strings
        treatment['treatment_day'] = float(treatment['treatment_day'])

    c.execute(
        '''
        SELECT * FROM measurements
        WHERE
            study_number=?
            AND (
                activity="Caliper - Tumor measurements"
                OR activity="Caliper - Tumor measurements (trilogy)"
            )
            AND measurement_units = "mm3"
        ORDER BY CAST(measurement_day AS FLOAT)
        ''',
        (study_number, ),
    )
    measurements = list(dictify_cursor(c))
    for measurement in measurements:
        # TODO we may want to update these types in the DB so that they're not just strings
        measurement['measurement_day'] = float(measurement['measurement_day'])
        measurement['measurement_value'] = float(measurement['measurement_value'])

    c.execute(
        '''SELECT * FROM animals WHERE study_number=?''',
        (study_number, )
    )
    animals = list(dictify_cursor(c))

    c.execute(
        '''SELECT group_name, curated_group_name FROM groups
                WHERE
                study_number=?
                AND curated_group_name != ""
        ''',
        (study_number, ),
    )
    group_labels = {d['group_name']: d['curated_group_name'] for d in dictify_cursor(c)}

    return flask.render_template(
        'study.html',
        study=study,
        treatments=treatments,
        measurements=measurements,
        animals=animals,
        group_labels=group_labels,
    )


@app.route('/index.html')
def index_html():
    dbCon = get_db_connection()
    c = dbCon.cursor()

    results = c.execute('''SELECT * FROM studies''')

    return flask.render_template('index.html', studies=dictify_cursor(results))


if __name__ == '__main__':
    app.debug = True
    try:
        app.run(host='0.0.0.0')
    except:
        app.run(host='0.0.0.0', port=5001)
        
