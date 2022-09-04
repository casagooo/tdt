/**
 * Covering Array Strength Example
 * 
 * Covering Arrayの概念を導入し、
 * 各Persprctiveにて強度の指定をすることで、
 * 比較的有効性の低いテストケースを削減できる。
 * 
 * 何も指定しない場合は、完全網羅となる。
 */
import { generateTests, Exclusions, List, Perspectives, Tree } from '../../index';

const domain = {
    "Given":{
        "User":{
            "Age":[
                "0-9",
                "10-19",
                "20-",
            ],
            "Job":[
                "Student",
                "Teacher",
                "Other",
            ],
            "isRegistered":[
                "True",
                "False",
            ],
            "isEmailVerified":[
                "True",
                "False",
            ],
        }
    },
    "When":[
        "Try to post comments",
    ],
    "Then":[
        "Success",
        "Failure",
        "Any",
    ],
} as const;
type ExampleDomain = typeof domain
const defaults:Tree<ExampleDomain> = {
    "Given":{
        "User":{
            "Age":"10-19",
            "Job":"Student",
            "isRegistered":"False",
            "isEmailVerified":"False",
        }
    },
    "When":"Try to post comments",
    "Then": "Any",
} as const;
const exclusions:Exclusions<ExampleDomain> = [
    {
        "Given.User.isRegistered" : "False",
        "Given.User.isEmailVerified" : "True",
    },
    {
        "Given.User.Age" : "0-9",
        "Given.User.Job" : "Teacher",
    },
] as const;
const perspectives:Perspectives<ExampleDomain> = [
    {
        "title": "Only verified students or verified teachers can post comments.",
        "constants": {
        },
        "variables": [
            "Given.User.Age",
            "Given.User.Job",
            "Given.User.isRegistered",
            "Given.User.isEmailVerified",
        ],
        "expect": (test:List<ExampleDomain>)=>{
            if(test["Given.User.isEmailVerified"] && 
                (test["Given.User.Job"] === "Student" || test["Given.User.Job"] === "Teacher")
            ){
                test["Then"] = "Success";
            }else{
                test["Then"] = "Failure";
            }
            return test
        },
        "strength" : 2,
    }
] as const;
const tests = generateTests(
    domain,
    defaults,
    exclusions,
    perspectives,
    {
        json:{
            file_path: '04.json',
        },
        markdown:{
            file_path: '04.md',
            true_symbol: 'X',
            false_symbol: '-',
        }
    },
)
console.log(tests)