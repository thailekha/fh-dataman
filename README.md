# fh-dataman

[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> A new backend service for the RHMAP databrowser

This service will act as the new backend service for the databrowser in RHMAP studio.

## Table of Contents

- [Build](#Build)
- [Usage](#usage)
- [API](#api)
- [Contribute](#contribute)
- [License](#license)

## Build

### Transpile

This service is written with ES6 and transpiled to ES5 using Babel. All the source code should be written in the `src` directory. Then run

```bash
grunt babel
```

transpile the code. The traspiled code will be written to the `lib` dir.


### Adding Unit Tests

Unit tests should be added to the same directory of the test target file. It should have a suffix wtih "_test.js". Tests should be written using ES6 syntax as well. To run all the tests:

```bash
grunt test
```

## Usage

To start the service, run

```bash
node ./lib/app.js ./config/dev.json
```

## API
To view API docs [start the service](#usage) and navigate to `/api`.

### Swagger API docs
If adding a new API to fh-dataman make sure to update the API docs.

fh-dataman is using [Swagger](http://swagger.io) for documentation. How fh-dataman is using Swagger is a combination of [Swagger UI](https://github.com/swagger-api/swagger-ui) - a framework to generate and display the API definition in HTML - and a spec which is a a JSON object describing the [OpenAPI Specification](http://swagger.io/specification).

fh-datamans' spec object is located in the [api-docs/swagger.json](api-docs/swagger.json) file.

New API endpoints can be entered under the `paths` property.

```
{
    "swagger": "2.0",
    "info": {
        "title": "fh-dataman API",
        "description": "Backend service for the RHMAP studio databrowser",
        "version": "1.0.0"
    },
    "schemes": [
        "http"
    ],
    "basePath": "/",
    "paths": {
        "/collection": {
          // API definition
        },

        // Add new API definition
    }
}
```

## Contribute

PRs accepted.

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT © RedHat
