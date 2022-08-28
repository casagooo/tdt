/**
 * Not Typed Args Example
 * 
 * generateTestsの各引数の宣言時に、型を指定しない例。
 * この場合は、引数作成時にIDEによる補完は効かない。
 * 引数に不備がある場合は、エラーとなる。
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
const default_tree = {
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
const tests = generateTests(
    example_domain,
    default_tree,
    exclusions,
    perspectives,
)
console.log(tests)