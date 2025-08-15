# STAC API Contracts
Base: https://earth-search.aws.element84.com/v1

POST /search
Body:
{
  "collections": ["sentinel-2-l2a"],
  "bbox": [w,s,e,n],
  "datetime": "YYYY-MM-DD/YYYY-MM-DD",
  "limit": 50,
  "query": {"eo:cloud_cover": {"lt": 20}}
}

Response:
{ "features": [StacItem] }

Normalization:
- id, geometry, bbox
- properties.datetime | start_datetime | end_datetime
- assets.thumbnail.href OR first image/png|jpeg
