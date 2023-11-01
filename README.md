# Typed Decision Table
## Overview
This tool, written in Typescript, automates the generation of test cases in the form of a [Decision Table](https://www.ibm.com/docs/en/bpmoc?topic=SS964W/com.ibm.wbpm.admin.doc/topics/cbre_busiru_decisiontable.html) from minimal inputs. There's no need to manually input each cell in the table.

Leveraging the power of Typescript generics, the tool ensures that the generated test cases are typed according to your specifications. This feature facilitates the accurate handling of keys and values in any test code you write.

Furthermore, not just the outputs but also some of the inputs are typed using generics, streamlining the process of preparing the necessary inputs.

Additional features of this tool include:

- File output in JSON or Markdown format.
- Support for the strength of the [Covering Array](https://math.nist.gov/coveringarrays/coveringarray.html).

## Install
`npm install tdt`

## Example
Generate test cases as shown in the example below. The output is an array of objects, with each object representing a single test case.

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

## Usage
To generate test cases, you'll need the following inputs:

- Parameter domains (all potential values for the parameters).
- Default values for the parameters.
- Combinations of values to exclude.
- Testing perspectives.

#### 1. Parameter Domains
List all potential values for every parameter associated with the test condition. This should also encompass expected results.

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
Unlike other inputs, this one isn't typed as a generic type. You have the flexibility to define its structure, provided it meets the necessary criteria. Based on this structure, the subsequent inputs (items `2.`, `3.`, and `4.`) will be automatically typed.

#### 2. Default Values for the Parameters
Specify the default values for the parameters outlined in section `1.`. For each parameter, select a value from the list of potential values. These defaults are used when a parameter value isn't explicitly set in a test case.
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

#### 3. Combinations of Values to Exclude
Use this to omit combinations of parameter values that are either impossible or lack significance. Multiple combinations can be excluded.
###### Example:
```
const exclusions:Exclusions<ExampleDomain> = [
	{
		"Condition.User.IsRegistered" : "False",
		"Condition.User.IsAdmin" : "True"
	}
] as const;
```

#### 4. Testing Perspectives
This determines the approach for generating test cases. Typically, test cases should be formulated based on a specific perspective or focus. Hence, this tool generates all test cases in alignment with the provided perspectives.

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

## Features
### File Output in JSON or Markdown Format
By setting certain options in the `generateTests` arguments, you can export the test cases to files.

###### Example of setting an option:
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
###### Example of a JSON file:
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
###### Example of a Markdown file:
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


### Support for `strength` in Covering Array
By default, this tool generates all possible combinations of the `variables` defined in the `perspectives`. However, this can result in a significantly large number of test cases.

To mitigate this, you can set the `strength` for each `perspective`. By adjusting the `strength`, less relevant test cases will be filtered out. The `strength` value can range from `2` up to the total number of `variables` in the perspective. A lower `strength` value will yield fewer test cases.

For instance, if the `perspective` is structured as below, and there are `3` `variables`, the `strength` can be set anywhere between `2` and `3`.

###### Example of setting the `strength`:
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
