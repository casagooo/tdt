/**
 * Not Typed Args Example
 * 
 * An example of not specifying types when declaring each argument in generateTests. 
 * In this case, IDE autocompletion will not be effective when creating arguments. 
 * An error will occur only if there is an issue with the arguments.
 */
 import { generateTests, Exclusions, List, Perspectives, Tree } from '../../index';

 const domain = {
    "Given":{
        "Student":{
            "Course":[
                "Bachelor",
                "Master",
                "Doctor",
            ],
            "Grade":[
                "1",
                "2",
                "3",
                "4",
            ]
        }
    },
    "When":[
        "Try to login",
    ],
    "Then":[
        "Pass",
        "Fail",
        "Any",
    ],
} as const;
const defaults = {
    "Given":{
        "Student":{
            "Course":"Bachelor",
            "Grade":"1",
        }
    },
    "When":"Try to login",
    "Then": "Any",
} as const;
const exclusions = [
    {
        "Given.Student.Course" : "Master",
        "Given.Student.Grade" : "3",
    },
    {
        "Given.Student.Course" : "Master",
        "Given.Student.Grade" : "4",
    },
    {
        "Given.Student.Course" : "Doctor",
        "Given.Student.Grade" : "4",
    },
] as const;
const perspectives = [
    {
        "title": "Only Bachelors can login.",
        "constants": {
        },
        "variables": [
            "Given.Student.Course",
            "Given.Student.Grade",
        ],
        "expect": (test)=>{
            if(test["Given.Student.Course"] === "Bachelor"){
                test["Then"] = "Pass";
            }else{
                test["Then"] = "Fail";
            }
            return test
        }
    }
] as const;
const tests = generateTests({
    domain,
    defaults,
    exclusions,
    perspectives,
})
console.log(tests)