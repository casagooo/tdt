/**
 * RegExp Exclusion Example
 * 
 * テストケースから除外する条件に、正規表現を利用する例。
 * この場合、正規表現で指定するパターンにおいて、IDEによる補完の恩恵は得られない。
 */
import { generateTests, Exclusions, List, Perspectives, Tree } from '../../index';

const example_domain = {
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
type ExampleDomain = typeof example_domain
const default_tree:Tree<ExampleDomain> = {
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
    example_domain,
    default_tree,
    exclusions,
    perspectives,
)
console.log(tests)