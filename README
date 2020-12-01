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

/api/service/image (POST)
/api/service/animation (POST)
/api/job-status/{someJobId} (GET)
/api/download/{someJobId} (GET)

See POSTMAN collection for example requests:


## Getting Started

Node v14.5.0

#### Run locally

Install dependencies:
```
npm install
```

Start rabbitMQ and mongoDB services:
```
docker-compose -f docker-compose.local.yml up --build -d
```

Run app and workers (single or clustered):
```
npm run start:dev
npm run start:dev:clustered
```

* In production use a cluster of workers.

#### Run with Docker
```
docker-compose up --build -d
```

* The project is setup to use AWS credentials from the host machine. Credentials should not be included anywhere in
this project to follow good practices. Certain upload operations will likely fail when running this app with Docker.



