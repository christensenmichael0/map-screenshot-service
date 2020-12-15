# Image/Animation Generation Service

Output images contain a basemap with various data layers overlaid. Each frame contains header text to supply
information about each layer visualized.

## Architecture

![Image of Competing Consumer Pattern](https://miro.medium.com/max/664/0*ykyMN4e7221uqmLl.png)

This project uses Advanced Message Queuing Protocol (AMQP) and RabbitMQ as the message broker.
A competing consumer pattern is used to distribute load among a configurable number of workers.
Message events are triggered by calls to specific endpoints and added to a durable queue. Message
acknowledgements are enabled in this service to force the consumer to tell RabbitMQ that the message
has been received and processed. Single image and multi-image (animation) tasks are long-running.
Upon requesting an image or animation the service responds immediately to the client with information
detailing the task id and job status. Active client-side polling to get job status updates should be
employed. Once the task is complete, the client should request the resource from the "download" endpoint
specifying the task id.

MongoDB is used as a central store of task status information.

Routes:

/api/service/image (POST)<br>
/api/service/animation (POST)<br>
/api/job-status/{someJobId} (GET)<br>
/api/download/{someJobId} (GET)<br>

See POSTMAN collection in project root for example requests (import directly into POSTMAN):<br>

image-and-animation-generation.postman_collection.json

## Getting Started

Node v14.5.0

#### Developing Locally

Install dependencies:
```
npm install
```

Start rabbitMQ and mongoDB services first:<br>
```
docker-compose -f docker-compose.local.yml up --build -d
```

Run app and worker (start server and a single worker):
```
npm run start:dev
```

alternatively (start server and worker separately - the server must be started before the worker):<br>
```
npm run start
npm run worker
```

#### Running with Docker
To start the express server and the workers in the same container (default on dev server):<br>
```
docker-compose up --build -d
```

To start the express server and the workers in separate containers you can alternatively run:<br>
```
docker-compose -f docker-compose.prod.yml up --build -d
```

* The project is setup to use AWS credentials from the host machine. Credentials should not be included anywhere in
this project to follow good practices. Credentials are mounted using a volume (see docker-compose.yml).

#### Postman Request Descriptions

single-layer-image: generate an image with a single layer on GEBCO basemap<br>

single-layer-image (gray tile basemap): generate an image with a single layer on an ESRI light gray tile basemap.<br>

tile-data-layer: generate an image with a tile basemap and a tile data layer<br>

image w/2 layers: generate an image with 2 data layers on GEBCO basemap<br>

IDL crossing: generate an image with a single layer that crosses the international date line.<br>

depth-label: generate an image with a single layer that shows a depth value in header<br>

animation-generation: generate an mp4 file with a single layer and multiple frames<br>

animation-with-2-layers: generate an mp4 file with multiple layers and multiple frames<br>

get job status: Get the status of a particular job<br>

download-image: Download an image.<br>

download-animation: Download an animation.<br>


#### RabbitMQ
Use the rabbitMQ management system to view messages in the "animation" and "image" queue.
This admin tool can also be used to purge messages and delete queues:<br>

http://localhost:15672/#/queues



