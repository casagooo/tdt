/**
 * RegExp Exclusion Example
 * 
 * An example of using regular expressions to exclude conditions from test cases. 
 * In this case, the benefits of IDE autocompletion are not available for patterns specified by regular expressions.
 */
import { generateTests, Exclusions, List, Perspectives, Tree, Defaults } from '../../index';

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
type ExampleDomain = typeof domain
const defaults:Defaults<ExampleDomain> = {
    "Given":{
        "Student":{
            "Course":"Bachelor",
            "Grade":"1",
        }
    },
    "When":"Try to login",
    "Then": "Any",
} as const;
const exclusions:Exclusions<ExampleDomain> = [
    {
        "Given.Student.Course" : "Master",
        "Given.Student.Grade" : /(3|4)/,
    },
    {
        "Given.Student.Course" : "Doctor",
        "Given.Student.Grade" : "4",
    },
] as const;
const perspectives:Perspectives<ExampleDomain> = [
    {
        "title": "Only Bachelors can login.",
        "constants": {
        },
        "variables": [
            "Given.Student.Course",
            "Given.Student.Grade",
        ],
        "expect": (test:List<ExampleDomain>)=>{
            if(test["Given.Student.Course"] === "Bachelor"){
                test["Then"] = "Pass";
            }else{
                test["Then"] = "Fail";
            }
            return test
        }
    }
] as const;
const tests = generateTests(
    domain,
    defaults,
    exclusions,
    perspectives,
)
console.log(tests)