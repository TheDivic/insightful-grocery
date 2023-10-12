# Insightful Grocery Store

## Getting started

Pre-requisites:
- Install Docker & docker-compose,
- Run `npm i` to install 3rd party packages

There are two ways you can start the app:
- Run `docker compose up` to start both the mongodb server & the dockerized API.
- Run mongo separately `docker compose up -d mongodb` and run the app in dev mode with live reload `npm run start:dev`

In both cases the API should be available on `localhost:8080`. You can ping it using `curl localhost:8080/ping`.

After startup you can run the following command to populate the DB with test data (see the `Data Model` section for more details).
- `npm run seed`

To stop all services and teardown the database you can use:
- `docker compose down -v`

## Testing

### Unit tests
Unit tests are in the `src/test` directory and each file represents tests for one role, according to the task specification. Ava runs every test file in a separate process, so we have isolation.

Unit tests don't require any 3rd party dependencies, I used an in-memory mock MongoDB for tests and [supertest](https://www.npmjs.com/package/supertest) for API testing. They should work outside of the box.

I used a simple test label naming convention:
- `(+) something` means that the current role can do something (e.g. managers can view other managers)
- `(-) something` tests that the current role CAN'T do something (e.g. employees can't view managers)

Commands:
- Run all unit tests with `npm run test`
- Run a specific test with `npm run test -- --match 'test label'`

### Manual
You can use the example requests in the `examples` directory to test the API manually.

I use the fantastic [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) VS Code extension to run them directly from the editor.

Just make sure to edit/replace the JWT token and object IDs which are local to your machine.

You can generate a JWT token for any user manually (for testing purposes) using the `npm run auth -- <some_email>` for example `npm run auth -- Dane_Kub@gmail.com` and copy the JWT token printed to the console.

> 💡 Make sure you are using the correct user auth token, or you will have problems with permissions! The example requests in the `examples` directory already contain a valid JWT token generated with the default secret, without an expiration date, so if you don't change it you will get responses for a different user than the one you anticipated!

## Data Model

The store hierarchy given in the test specification is a classic example of a Tree data structure. MongoDB docs outline [5 different approaches](https://www.mongodb.com/docs/manual/applications/data-models-tree-structures/) for modelling trees in Mongo.

None of the approaches that use references to parent or child nodes will work efficiently for us because of the following requirement:

> Retrieving all (employees | managers) for one node and all his descendants

If we used parent/child references, this query would require a slow & recursive graph traversal of the target subtree.

The best approach is to use [Materialized Paths](https://www.mongodb.com/docs/manual/tutorial/model-tree-structures-with-materialized-paths/) that enable fast lookup of subtrees with a regex.

### Store

The store identifier is the **store path** in period-delimited format, like this: `srbija.grad-beograd.vracar`.
Users can view employees only from stores that belong to their subtree (see the `Authorization` section).

The example store data (replicated the example from the task pdf) is in [1_stores.json](seed/stores/1_stores.json).

### Employee

Employee is the generic collection that holds both actual employeees and managers, they differ only in their `role` property.

Each employee document contains a path to it's parent store.

Fetching employees for a given store is quite easy with materialized paths:
- To fetch employees working at a node use exact matching: `{ nodePath: <somepath>}`
- To fetch employees working at a node and it's descendats use regex matching: `{ nodePath: /<somepath>/}`

For that purpose I created a specialized text search index on the `Employee.nodePath` property.

The example employees are in [2_employees.json](seed/employees/2_employees.json) file. I used a script [employee-gen.ts](src/scripts/employee-gen.ts) to generate test employees using [Faker](https://fakerjs.dev/guide/).

## Auth

### Authentication
All requests use JWT authentication, and require a `Authorization: Bearer <jwt>` header.
You can self-sign a JWT token for testing purposes using `npm run auth -- <some_email_from_db>` and copy the token from the terminal and use it in your request.
The token generation code is in [authenticate.ts](src/scripts/authenticate.ts)

### Authorization
Since we are using materialized paths and JWTs, authorization can be performed **without querying the database**.

Take a look at [auth/middleware.ts](src/auth/middleware.ts), all we need to do is compare the current user's nodePath from the decoded JWT with the `storePath` param in the request URI.

Based on the task requirements, a user is authorized to view nodes that belong to his subtree, e.g. his `nodePath` is a prefix of the store path.

## API

### `POST /:storePath/managers`

Create a new manager at a store with with the request body:
```ts
{
  name: string
  email: string
}
```

### `GET /:storePath/managers?deep=<true | false>`

Retrieves all managers for a given node. If `deep=true` it will return also managers for all of it's descendants.

### `GET /:storePath/managers/:managerId`

Retrieves a single manager from a node by ID.

### `PUT /:storePath/managers/:managerId`

Update a manager by ID using the following request body:
```ts
{
  name: string,
  email: string,
  role: "employee" | "manager",
  nodePath: string
}
```
> ⚠️ If you update the nodePath to some other store that is not in your subtree, you won't be able to access that employee any more, with the same user.


### `DELETE /:storePath/managers/:managerId`

Deletes a manager from a store by ID.

### `POST /:storePath/employees`

Create a new employee at a store with with the request body:
```ts
{
  name: string
  email: string
}
```

### `GET /:storePath/employees?deep=<true | false>`

Retrieves all employees for a given node. If `deep=true` it will also return employees for all of it's descendants.

### `GET /:storePath/employees/:employeeId`

Retrieves a single employee from a node by ID.

### `PUT /:storePath/employees/:employeeId`

Update an employee by ID using the following request body:
```ts
{
  name: string,
  email: string,
  role: "employee" | "manager",
  nodePath: string
}
```
> ⚠️ If you update the nodePath to some other store that is not in your subtree, you won't be able to access that employee any more, with the same user.


### `DELETE /:storePath/employees/:employeeId`

Deletes an employee from a store by ID.
