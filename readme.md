# PDX-SOC: Generate drug response graphs for PDX tumors

This software generates the drug response graphs available at
http://tumor.informatics.jax.org/mtbwi/index.do.

## Deployment
The PDX-SOC software package can be downloaded and deployed "as-is" on web 
servers that can execute and serve Python applications. An SQLite database with the proper 
schema (see Database Schema) and data should be provided too.    

## Built With

* [Flask 0.10.1](http://flask.pocoo.org/docs/0.10/) - micro web framework written in Python 
* [Python 2.7.5](https://www.python.org/download/releases/2.7.5/) - interpreted high-level programming language
* [SQLite 3.*](https://www.sqlite.org/index.html) - a self-contained, high-reliability, embedded, full-featured, public-domain SQL database engine
* [Plotly.js](https://plot.ly/javascript/) - a high-level, declarative charting JavaScript library

## Authors

* **Al Simons** - al.simons@jax.org - data loading scripts and database design
* **Georgi Kolishovski** - georgi.kolishovski@jax.org - application and visualization code

## Licence

The project is licensed under the Apache 2 Licencse - see the [LICENSE.txt](/src/LICENSE.txt) file for more details

## Database Schema

```
sqlite> .schema
CREATE TABLE studies(
                study_number TEXT PRIMARY KEY,
                model_tm TEXT,
                model_j TEXT,
                curated_study_name TEXT,
                curated_study_number TEXT KEY,
                curated_study_legend TEXT
                );
CREATE TABLE groups(
                     study_number TEXT KEY,
                     group_name TEXT,
                     is_control INTEGER,
                     drug TEXT,
                     curated_group_name TEXT,
                     recist TEXT,
                     recist_n INTEGER
                 );
CREATE TABLE animals(
                study_number TEXT KEY,
                animal_name TEXT,
                group_name TEXT,
                UNIQUE(study_number, animal_name, group_name)
                );
CREATE TABLE treatments(
                study_number TEXT KEY,
                group_name TEXT,
                animal_name TEXT,
                treatment_day INTEGER,
                test_material_amount TEXT,
                administration_route_units TEXT,
                dose_activity TEXT,
                UNIQUE(study_number, group_name, animal_name,
                       treatment_day, dose_activity)
                );
CREATE TABLE measurements(
                study_number TEXT KEY,
                group_name TEXT,
                animal_name TEXT,
                measurement_day INTEGER,
                measurement_value FLOAT,
                UNIQUE(study_number, group_name, animal_name,
                       measurement_day)
                );
CREATE TABLE colors(
                     drug TEXT,
                     color TEXT
                 );
```

### Studies table

The studies table lists all of the studies which are available in this database.

| Field | Use |
|-------|-----|
| study_number | The official name of the study. This is not displayed in the plots, but is instead used as part of the key, which ties all the data together. |
| model_tm | The official name of the PDX model. |
| model_j | An alternate name of the model.|
| curated_study_name | The short text that is used as the title of each SOC plot, e.g., "Dosing study results of 1 treatment on bladder cancer PDX model TM00020"|
| curated_study_number | The form of the study number used to access the study in the interface; usually this is simply the model name (model_tm), but if that model is the subject of multiple studies, a unique suffix is applied. |
| curated_study_legend | The detailed description of the study, e.g., "NSG(TM) mice engrafted with passage 4 tumors for model J000100672 were treated with erlotinib (50 mg/kg; PO daily for 21 days; N=9) and cisplatin (2 mg/kg; IV once per week for three times; N=7). Mice were monitored for tumor volumes at least twice per week." |

### Groups table

The groups table lists all of the groups (study arms) which are available in
this database. Note that the values in the drug column must exactly match
the values in the treatments table's dose_activity column, including case.

| Field | Use |
|-------|-----|
| study_number | The number of the study of which this group is a part.  See the study_number field of the studies table. |
| group_name | The name of this group.  The name must be unique within this study. This name is not displayed' it is used to form part of the keys for joins.|
| is_control | A boolean flag (0 = False, 1 = True) indicating whether this group is the control for this study. |
| drug | The drug (or drugs) being administered to this group. If there are multiple drugs involved in this treatment, separate them with " + ". (This code has not been tested with more than two drugs being administered to a group.) |
| curated_group_name | The text that is displayed as the group name. |
| recist | The text that is displayed as the RECIST classification for this group. |
| recist_n | The number of animals involved in the RECIST calculations. |

### Animals table

The animals table gives an inventory of all the animals involved in this study,
and the group each was part of.

| Field | Use |
|-------|-----|
| study_number | The number of the study of which this animal was a part. |
| animal_name | The identifier for this animal. Must be unique within this study and group. |
| group_name | The group of this animal was a part. |

### Treatments table

The treatments table records all the treatments that were administered as part
of this study.  Note that the values in the dose_activity column must exactly match
the values in the groups table's drug column, including case.

| Field | Use |
|-------|-----|
| study_number | The study for which this treatment was administered. |
| group_name | The group for which this treatment was administered. |
| animal_name | The animal to which this treatment was administered. |
| treatment_day | The study day on which this treatment was administered.  For the purposes of these plots, the first treatment defines day zero.  All treatment and measurement days are measured from that first treatment. |
| test_material_amount | The amount of drug that was administered. |
| administration_route_units | The units in which the test_material_amount was measured, e.g., mg/kg. |
| dose_activity | The drug which was administered. |

### Measurements table

The measurements table records all of the tumor volume measurements that were
taken as part of the study.

| Field | Use |
|-------|-----|
| study_number | The study for which this measurement was made. |
| group_name | The group for which this measurement was made. |
| animal_name | The animal to which this measurement was made. |
| measurement_day | The day on which this measurement was made (days since the first treatment). |
| measurement_value | The measurement in mm3 of the tumor's volume. |

### Colors table

The colors table allows common drugs to be displayed in the same color across
studies. Drugs not specified in this table will be displayed in colors from a
palette, and may be assigned different colors from study to study.

| Field | Use |
|-------|-----|
| drug | The drug name, as specified in the groups table. |
| color | The CSS specification for the color in which to display this drug's information, in all studies. |