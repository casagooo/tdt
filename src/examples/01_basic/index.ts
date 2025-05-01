/**
 * Basic Example
 * 
 * An example of specifying types when declaring each argument in generateTests. 
 * In this case, you can benefit from IDE autocompletion when creating arguments. 
 * If there is an issue with the arguments, an error will occur.
 */
import { generateTests, Exclusions, Perspectives, Defaults, Test } from '../../index';

const domain = {
    "Condition":{
        "User":{
            "IsRegistered":[
                "True",
                "False"
            ],
            "IsAdmin":[
                "True",
                "False"
            ]
        },
        "Device":[
            "Mobile",
            "PC"
        ]
    },
    "ExpectedResult":[
        "Success",
        "Failure",
        "Any"
    ]
} as const;
type ExampleDomain = typeof domain;
const defaults : Defaults<ExampleDomain> = {
    "Condition":{
        "User":{
            "IsRegistered" : "True",
            "IsAdmin" : "False"
        },
        "Device":"Mobile"
    },
    "ExpectedResult":"Any"
} as const;
const exclusions:Exclusions<ExampleDomain> = [
    {
        "Condition.User.IsRegistered" : "False",
        "Condition.User.IsAdmin" : "True"
    }
] as const;
const perspectives:Perspectives<ExampleDomain> = [
    {
        "title": "Only registered users accessed from PC can access.",
        "constants": {},
        "variables": [
            "Condition.User.IsRegistered",
            "Condition.User.IsAdmin",
            "Condition.Device",
        ],
        "expect": (test:Test<ExampleDomain>)=>{
            if(
                test["Condition.User.IsRegistered"] === "True" &&
                test["Condition.Device"] === "PC"
            ){
                test["ExpectedResult"] = "Success";
            }else{
                test["ExpectedResult"] = "Failure";
            }
            return test
        },
    }
] as const;
const tests = generateTests({
    domain,
    //defaults,
    exclusions,
    perspectives,
});
console.log(tests)