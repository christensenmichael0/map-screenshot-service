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

See POSTMAN collection for example requests:


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
To start the express server and the workers in the same container run (default on dev server):<br>
```
docker-compose up --build -d
```

To start the express server and the workers in separate containers you can alternatively run:<br>
```
docker-compose -f docker-compose.prod.yml up --build -d
```

* The project is setup to use AWS credentials from the host machine. Credentials should not be included anywhere in
this project to follow good practices. Credentials are mounted using a volume (see docker-compose.yml).



