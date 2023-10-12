/*
A script used to generate fake employees using Faker.
Use it like this: ts-node employee-gen.ts > employees.json
*/
import { IEmployee, Role } from "../employee/employee";
import { faker } from "@faker-js/faker";
import { IPostEmployee } from "../employee/types";

const nodes = [
  "/srbija",
  "/srbija/vojvodina",
  "/srbija/vojvodina/severnobacki-okrug",
  "/srbija/vojvodina/severnobacki-okrug/subotica",
  "/srbija/vojvodina/severnobacki-okrug/subotica/radnja-1",
  "/srbija/vojvodina/juznobacki-okrug",
  "/srbija/vojvodina/juznobacki-okrug/novi-sad",
  "/srbija/vojvodina/juznobacki-okrug/novi-sad/detelinara",
  "/srbija/vojvodina/juznobacki-okrug/novi-sad/detelinara/radnja-2",
  "/srbija/vojvodina/juznobacki-okrug/novi-sad/detelinara/radnja-3",
  "/srbija/vojvodina/juznobacki-okrug/novi-sad/liman",
  "/srbija/vojvodina/juznobacki-okrug/novi-sad/liman/radnja-4",
  "/srbija/vojvodina/juznobacki-okrug/novi-sad/liman/radnja-5",
  "/srbija/grad-beograd",
  "/srbija/grad-beograd/novi-beograd",
  "/srbija/grad-beograd/novi-beograd/bezanija",
  "/srbija/grad-beograd/novi-beograd/bezanija/radnja-6",
  "/srbija/grad-beograd/vracar",
  "/srbija/grad-beograd/vracar/neimar",
  "/srbija/grad-beograd/vracar/neimar/radnja-7",
  "/srbija/grad-beograd/vracar/crveni-krst",
  "/srbija/grad-beograd/vracar/crveni-krst/radnja-8",
  "/srbija/grad-beograd/vracar/crveni-krst/radnja-9",
];

type IEmployeeNoId = Omit<IEmployee, "_id">;

const employees: IEmployeeNoId[] = [];

const generateEmployee = (path: string, role: Role): IEmployeeNoId => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email({ firstName, lastName });
  return {
    name: `${firstName} ${lastName}`,
    email,
    nodePath: path,
    role,
  };
};

const randInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * max + min);
};

for (const path of nodes) {
  for (let i = 0; i < randInt(1, 3); i++) {
    employees.push(generateEmployee(path, Role.Manager));
  }

  for (let i = 0; i < randInt(1, 50); i++) {
    employees.push(generateEmployee(path, Role.Employee));
  }
}

console.log(JSON.stringify(employees, null, "  "));
