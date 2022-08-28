# Typed Decision Table
## Overview
This is a Typescript tool for generating test cases in the form of a [Decision Table](https://www.ibm.com/docs/en/bpmoc?topic=SS964W/com.ibm.wbpm.admin.doc/topics/cbre_busiru_decisiontable.html) from minimal inputs. You don't have to input every cell in the table manually any more.

Thanks to generics of Typescript, this tool outputs test cases typed according to your inputs.
This makes you easy to treat keys and values of the test cases correctly in your any test code. 

Not only outputs of this tool but also some of inputs are typed with generics. This makes you easy to prepare required inputs correctly.

This tool also has following features.
- File output (JSON / Markdown)
- Support for `strength` of [Covering Array](https://math.nist.gov/coveringarrays/coveringarray.html)

## Install
`npm install tdt`

## Usage
To generate testcases, following inputs are required.

1. Domains of the parameters (Possible values of the parameters)
2. Default values of the parameters
3. Combinations of the values to be excluded
4. Perspectives of the testing

### Inputs
####  1. Domains of the parameters
This should include all of the possible values of all parameters related with test condition, including expected results. 
###### Example:
```
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
```
 This is the only input which is not typed as a generic type. This can be defined as any structure as long as it satisfies the required conditions. According to this structure, the rest of the inputs, `2.`,`3.` and `4.`, will be typed automatically.

#### 2. Default values of the parameters
This should be the default values of the parameters defined in `1.`. You have to choose a value from the possible values about each parameters. This is used only when the parameter is not specified in the test case. 
###### Example:
```
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
```

#### 3. Combinations of the values to be excluded
This is used to exclude impossible or meanless combinations of the parameter values. This can have multiple combinations.
###### Example:
```
const exclusions:Exclusions<ExampleDomain> = [
	{
		"Condition.User.IsRegistered" : "False",
		"Condition.User.IsAdmin" : "True"
	}
] as const;
```

#### 4. Perspectives of the testing
This specifies how to generate test cases. In general, all of test cases must be defined based on the perspective, what to check in testing. Therefore, all tests in this tool are generated according to specified perspectives.

###### Example:
```
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
```

### Outputs
You can get generated test cases by calling `generateTests` function with prepared inputs above.
###### Example:
```
const tests = generateTests(
	domain,
	defaults,
	exclusions,
	perspectives,
);

console.log(tests)
/*
[
	{
		'Condition.User.IsRegistered': 'True',
		'Condition.User.IsAdmin': 'True',
		'Condition.Device': 'Mobile',
		ExpectedResult: 'Failure',
		Perspective: 'Only registered users accessed from PC can access.',
		ID: '1'
	},
	{
		'Condition.User.IsRegistered': 'True',
		'Condition.User.IsAdmin': 'True',
		'Condition.Device': 'PC',
		ExpectedResult: 'Success',
		Perspective: 'Only registered users accessed from PC can access.',
		ID: '2'
	},
	{
		'Condition.User.IsRegistered': 'True',
		'Condition.User.IsAdmin': 'False',
		'Condition.Device': 'Mobile',
		ExpectedResult: 'Failure',
		Perspective: 'Only registered users accessed from PC can access.',
		ID: '3'
	},
	{
		'Condition.User.IsRegistered': 'True',
		'Condition.User.IsAdmin': 'False',
		'Condition.Device': 'PC',
		ExpectedResult: 'Success',
		Perspective: 'Only registered users accessed from PC can access.',
		ID: '4'
	},
	{
		'Condition.User.IsRegistered': 'False',
		'Condition.User.IsAdmin': 'False',
		'Condition.Device': 'Mobile',
		ExpectedResult: 'Failure',
		Perspective: 'Only registered users accessed from PC can access.',
		ID: '5'
	},
	{
		'Condition.User.IsRegistered': 'False',
		'Condition.User.IsAdmin': 'False',
		'Condition.Device': 'PC',
		ExpectedResult: 'Failure',
		Perspective: 'Only registered users accessed from PC can access.',
		ID: '6'
	}
]
*/
```
## Features
### File Output
Specifying some options in the `generateTests` arguments, you can output the test cases as files.
###### Example of specifying option:
```:diff
const tests = generateTests(
	domain,
	defaults,
	exclusions,
	perspectives,
+	{
+		json:{
+			file_path: '01.json',
+		},
+		markdown:{
+			file_path: '01.md',
+			true_symbol: 'X',
+			false_symbol: '-'
+		}
+	}
);
```
###### Example of JSON file:
```
[
	{
		"Condition.User.IsRegistered": "True",
		"Condition.User.IsAdmin": "True",
		"Condition.Device": "Mobile",
		"ExpectedResult": "Failure",
		"Perspective": "Only registered users accessed from PC can access.",
		"ID": "1"
	},
	{
		"Condition.User.IsRegistered": "True",
		"Condition.User.IsAdmin": "True",
		"Condition.Device": "PC",
		"ExpectedResult": "Success",
		"Perspective": "Only registered users accessed from PC can access.",
		"ID": "2"
	},
	{
		"Condition.User.IsRegistered": "True",
		"Condition.User.IsAdmin": "False",
		"Condition.Device": "Mobile",
		"ExpectedResult": "Failure",
		"Perspective": "Only registered users accessed from PC can access.",
		"ID": "3"
	},
	{
		"Condition.User.IsRegistered": "True",
		"Condition.User.IsAdmin": "False",
		"Condition.Device": "PC",
		"ExpectedResult": "Success",
		"Perspective": "Only registered users accessed from PC can access.",
		"ID": "4"
	},
	{
		"Condition.User.IsRegistered": "False",
		"Condition.User.IsAdmin": "False",
		"Condition.Device": "Mobile",
		"ExpectedResult": "Failure",
		"Perspective": "Only registered users accessed from PC can access.",
		"ID": "5"
	},
	{
		"Condition.User.IsRegistered": "False",
		"Condition.User.IsAdmin": "False",
		"Condition.Device": "PC",
		"ExpectedResult": "Failure",
		"Perspective": "Only registered users accessed from PC can access.",
		"ID": "6"
	}
]
```
###### Example of Markdown file:
|||#1|#2|#3|#4|#5|#6|
|--|--|--|--|--|--|--|--|
|Condition.User.IsRegistered|True|X|X|X|X|-|-|
||False|-|-|-|-|X|X|
|Condition.User.IsAdmin|True|X|X|-|-|-|-|
||False|-|-|X|X|X|X|
|Condition.Device|Mobile|X|-|X|-|X|-|
||PC|-|X|-|X|-|X|
|ExpectedResult|Success|-|X|-|X|-|-|
||Failure|X|-|X|-|X|X|
||Any|-|-|-|-|-|-|


### Support for `strength` of Covering Array
Default behavior of this tool is to generate all of the combinations of the `variables` specified in the `perspectives`. But this can lead to an explosion in the number of test cases. 

To prevent this, you can specify `strength` in each `perspective`. If you specify `strength`,  less effective test cases will be removed. The `strength` can be between `2` and the number of `variables` in the `perspective`, and the smaller the `strength`, the smaller the number of test cases. 

For example, if the `perspective` is like shown below, the number of `variables` is `3`. Therefore `strength` can be between `2` and `3`.

###### Example of specifying strength:
```:diff
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
+	"strength" : 2,
}
```