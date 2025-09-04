//=============================================================================================================
//	Common Types
//=============================================================================================================
/**
 * Used to specify the strength of a CoveringArray
 */
type CoveringStrength = 0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19

/**
 * Type used as an index within recursive iterations
 */	
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
	11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]]

/**
 * Concatenates two strings into one
 */
type Join<K, P> = 
	K extends string | number
		?	P extends string | number
			?	`${K}${"" extends P ? "" : "."}${P}`
			: never
		: never;

/**
 * Path to a leaf element in an object (keys concatenated by dots)
 * If D extends number = 10,
 * Error: Type instantiation is excessively deep and possibly infinite.(2589)
 * Thus, it's reduced to 4.
 * // 例
 * type Example = {
 * 	a:{
 * 		x: [
 * 			"ppp",
 * 			"qqq",
 * 		],
 * 		y: [
 * 			
 * 		],
 * 	},
 * 	b: number,
 * }
 * 
 * Path<Example> // 'a.x'|'a,y'|'b'
 */
export type Path<T, D extends number = 4> = 
	[D] extends [never] 
		? never 
		: T extends readonly string[]
			? ""
			:	{ [K in keyof T]-?: Join<K, Path<T[K], Prev[D]>> }[keyof T] 

/**
 * Type of the leaf element in an object
 * // Example
 * type Example = {
 * 	a:{
 * 		x: number,
 * 		y: number,
 * 	},
 * 	b: 'あ' | 'い' | 'う',
 * }
 * 
 * Leaf<Example, 'a.x'> // number
 * Leaf<Example, 'b'> 	// 'あ' | 'い' | 'う'
 */
type Leaf<T, PATH extends string> = 
	PATH extends Path<T>
	? PATH extends `${infer KEY}.${infer REST}`
		? KEY extends keyof T
			? Leaf<T[KEY], REST>
			: never
		: PATH extends keyof T
			? T[PATH]
			:	never
	:	never

/**
 * Ensures that the type T includes key K
 */
type With<T,K extends string> = 
	K extends keyof T ? T : never;

/**
 * Represents the range and domain of a tree-structured object
 */
export type TreeDomain = {
	[key: string]: TreeDomain | readonly string[]
};

/**
 * Represents specific values of a tree-structured object
 */
export type Tree<D extends TreeDomain> = {
	// Utilized in a for-in loop as Extract<keyof D, string>
	[KEY in Extract<keyof D, string>]: 
		D[KEY] extends TreeDomain
			? Tree<D[KEY]>
			: D[KEY][number]
};

/**
 * Flattens an object of tree structure to a one-dimensional associative array.
 * Keys are concatenated with dots like `Given.User.Type`.
 */
export type ListDomain<D extends TreeDomain> = {
	[KEY in Path<D>]? : Leaf<D, KEY>
};

/**
 * Flattens an object of tree structure to a one-dimensional associative array.
 * Keys are concatenated with dots like `Given.User.Type`.
 * Keys are not required.
 */
export type List<D extends TreeDomain> = {
	[KEY in ("ID" | "Perspective" | Path<D>)] ?: 
		"ID" extends KEY
		? string
		: "Perspective" extends KEY 
			? string
			: Leaf<D, KEY> extends readonly string[]
        ? Leaf<D, KEY>[number]
        : never
};

//=============================================================================================================
//	Specific Types
//=============================================================================================================
/**
 * Default values for variables in a testcase
 */
export type Defaults<D extends TreeDomain> = Tree<D>

/**
 * Testcase
 */
export type Test<D extends TreeDomain> = List<D>

/**
 * Perspective to expand the testcase
 */
type Perspective<D extends TreeDomain> = {
	readonly "title":	string,
	readonly "constants": {
		[KEY in Path<D>]?: Leaf<D, KEY> extends readonly string[]
      ? Leaf<D, KEY>[number]
      : never
	},
	readonly "variables":readonly [Path<D>][number][],
	readonly "expect": (testcase: List<D>) => List<D>,
  readonly "strength" ? : CoveringStrength,
}

/**
 * Collection of perspectives for expanding testcases
 */
export type Perspectives<D extends TreeDomain> = readonly Perspective<D>[]

/**
 * Conditions to exclude certain combinations in a testcase
 * If these conditions are met, the testcase is excluded.
 */
type Exclusion<D extends TreeDomain> = {
	readonly [KEY in Path<D>]?: Leaf<D, KEY> extends readonly string[]
    ? Leaf<D, KEY>[number] | RegExp
    : never
}

/**
 * Collection of conditions to exclude certain combinations in a testcase
 */
export type Exclusions<D extends TreeDomain> = readonly Exclusion<D>[]

/**
 * Options for file export
 */
export type ExportOption = {
	json? : {
		file_path :string
	},
	markdown? : {
		file_path: string,
		true_symbol?: string,
		false_symbol?: string,
	}
}

/**
 * Options for generating tests
 */
export type GeneratingOption<D extends TreeDomain> = {
	domain:  			D,
	defaults?: 			Defaults<D>, 
	exclusions:   		Exclusions<D>,
	perspectives: 		Perspectives<D>, 
	export_option?:		ExportOption,
}

//=============================================================================================================
//	Functions
//=============================================================================================================
/**
 * Generates a complete set of testcases.
 * @param option 
 * @returns 
 */
export function generateTests<D extends TreeDomain>(
	option:	GeneratingOption<D>
){
  // Retrieve all parameters (example: "Given.User.Type", "When.Browser.Start")
  let list_domain:ListDomain<D> = {}
  treeDomainToListDomain<D>(list_domain, option.domain)

  // Create the default testcase
  let list_default:List<D> = {}
  if(option.defaults !== undefined){
  	treeToList<D>(list_default, option.defaults)
  }else{
	getDefaultTest<D>(list_default, option.domain)
  }
  console.log("============ Default Test ============")
  console.log(list_default)

  // Create the list of tests
  let raw_tests:Test<D>[] = []
  for(let perspective of option.perspectives){
    //------------------------------------------------
    // Expand based on a particular perspective
    //------------------------------------------------
    //------------------------------------------------
    // Reflect constants in the base testcase
    //------------------------------------------------
    let base_test : Test<D> = {...list_default}
    for(let key in perspective.constants){
      base_test[key] = perspective.constants[key]
    }
    //------------------------------------------------
    // Expand variables and reflect them in the testcase
    //------------------------------------------------
    raw_tests = [
			...raw_tests,
			...generateTestsByPerspective<D>(
				list_domain,
				perspective, 
				base_test, 
				option.exclusions,
			)
		]
  }

  // Assign ID to all testcases
  let id = 1
  for(let t in raw_tests){
    raw_tests[t]["ID"] = `${id}`
    id++
  }

	//------------------------------------------------
  // Arrange key order
	//------------------------------------------------
	let tests: Test<D>[] = []
	let body_keys = raw_tests.length > 0
		? Object.keys(raw_tests[0]).filter(key => !['ID','Perspective','ExpectedResult'].includes(key))
		: [];
	for(let t in raw_tests){
		let num = tests.push({});
		let k = num - 1;

		// Head
		tests[k]['ID'] 					= raw_tests[t]['ID'];
		tests[k]['Perspective'] = raw_tests[t]['Perspective'];

		// Body
		for(let key of body_keys){
			tests[k][key] = raw_tests[t][key];
		}

		// Foot
		tests[k]['ExpectedResult'] = raw_tests[t]['ExpectedResult'];
	}

  //-----------------------------------------------------
  // File output
  //-----------------------------------------------------
  if(option.export_option){
		const fs = require('fs')
		//-----------------------
		// JSON format
		//-----------------------
		if(option.export_option.json){
			fs.writeFile(`${option.export_option.json.file_path}`, 
				JSON.stringify(tests, null, '\t'), 
				(err) => {if(err)console.log(err)}
			);
		}
		//-----------------------
		// Markdown format
		//-----------------------
		if(option.export_option.markdown){
			// Convert to a table
			fs.writeFile(`${option.export_option.markdown.file_path}`, 
				toMarkdown(toTable(
					list_domain,
					tests, 
					option.export_option.markdown.true_symbol, 
					option.export_option.markdown.false_symbol
				)), 
				(err) => {if(err)console.log(err)}
			);
		}
	}

  return tests
}

/**
 * Converts variables from TreeDomain type to ListDomain type.
 * The data structure is converted from a tree to a one-dimensional associative array,
 * but the structure of the endpoints (leaves) remains unchanged (array of Strings).
 * @param result 
 * @param tree 
 * @param parent_path 
 */
function treeDomainToListDomain<D extends TreeDomain>(
    result:     ListDomain<D>, 
    tree:       TreeDomain, 
    parent_path =''
  ){
  for(const key in tree){
    const value = tree[key]
    const path = (parent_path === '' ? key : parent_path+'.'+key)
    if(isLeafOfTreeDomain(value)){
		// It's a leaf node, so register the choices
		if(typeof result[path] !== "undefined"){
			throw Error('Duplicate definitions exist.')
		}
      result[path] = value
    }else{
	  // Further recursively expand
      treeDomainToListDomain(result, value, path)
    }
  }
}

/**
 * Converts variables from TreeDomain type to Test type.
 * @param result 
 * @param domain 
 */
function getDefaultTest<D extends TreeDomain>(
    result:     Test<D>, 
    domain:		TreeDomain, 
  ){
  for(const key in domain){
    const value = domain[key]
    if(isLeafOfTreeDomain(value)){
		// It's a leaf node, so register the first choice
      	result[key] = value[0]
    }else{
	  // Further recursively expand
      getDefaultTest(result, value)
    }
  }
}

/**
 * Converts variables from Tree type to List type.
 * The data structure is converted from a tree to a one-dimensional associative array,
 * but the structure of the endpoints (leaves) remains unchanged (String).
 * @param result 
 * @param tree 
 * @param parent_path 
 */
function treeToList<D extends TreeDomain>(
    result:     List<D>,
    tree:       Tree<D>,
    parent_path=''
  ){
  for(const key in tree){
    const value = tree[key]
    const path = (parent_path === '' ? key : parent_path+'.'+key)
    if(isLeafOfTree(value)){
		// It's a leaf node, so register the value
		if(typeof result[path] !== "undefined"){
			throw Error('Duplicate definitions exist.')
		}
      result[path] = value
    }else{
	  // Further recursively expand
      treeToList(result, value, path)
    }
  }
}

/**
 * Generates test cases based on a perspective.
 * A recursive function.
 * @param tests 
 * @param list_domain 
 * @param perspective 
 * @param base_test 
 * @param exclusions 
 * @param v 
 */
function generateTestsByPerspective<D extends TreeDomain>(
    list_domain:  ListDomain<D>,
    perspective:  Perspective<D>,
    base_test:    Test<D>,
    exclusions:   Exclusions<D>,
  ):Test<D>[]{
		//---------------------------------------------------
		// 1. Retrieve the complete set of required combinations
		//---------------------------------------------------
		let requirements: List<D>[] = getRequirements(
			list_domain,
			perspective, 
			exclusions,
		)
		//---------------------------------------------------
		// 2. Generate a Covering Array
		//---------------------------------------------------
		let tests: Test<D>[] = [];
		generateCoveringArray(tests, requirements)
		//---------------------------------------------------
		// 3. Fill empty cells with default values
		//---------------------------------------------------
		applyBaseTestToCoveringArray(tests, base_test)

		//---------------------------------------------------
		// 4. Exclude tests that match prohibitions
		//---------------------------------------------------
		tests = tests.filter(test => {
			return !isExcluded(test, exclusions)
		})
		//---------------------------------------------------
		// 5. Add Perspective and Expected Results
		//---------------------------------------------------
		for(const t in tests){
			// Add perspective name
			tests[t]["Perspective"] = perspective.title.replace(/\(/gi,'（').replace(/\)/gi,'）')
			// Add expected results
			perspective.expect(tests[t])
		}
		return tests
}

function getRequirements<D extends TreeDomain>(
  list_domain:  ListDomain<D>,
  perspective : Perspective<D>,
  exclusions: Exclusions<D>,
):List<D>[]{
	// Runtime input check
	if(perspective.strength > perspective.variables.length){
		throw new Error("Coverage strength must be less than the length of variables.")
	}

	// Determine strength
	const strength = perspective.strength ?? perspective.variables.length;

	const variables_combinations = getSubsetArrays(
		perspective.variables as any[],
		strength
	);

	let requirements: List<D>[] = [];
	for(const combination of variables_combinations){
		getFullCoverage(
			requirements,
			{},
			list_domain,
			combination,
			exclusions,
			0,
		)
	}
	return requirements
}

/**
 * Based on the input array, retrieves subsets composed of specified element counts
 * @param array 
 * @param this_index 
 * @param num_to_choose 
 * @returns 
 */
function getSubsetArrays<T extends any>(array: readonly T[], m:number):T[][]{
	let result = [];
	if (array.length < m) {
		return []
	}
	if (m === 1) {
		for (let i = 0; i < array.length; i++) {
			result[i] = [array[i]];
		}
	} else {
		for (let i = 0; i < array.length - m + 1; i++) {
			let row = getSubsetArrays(array.slice(i + 1), m - 1);
			for (let j = 0; j < row.length; j++) {
				result.push([array[i]].concat(row[j]));
			}
		}
	}
	return result;
}

/**
 * Retrieves a complete coverage list concerning variables
 * @param lists 
 * @param base_list 
 * @param list_domain 
 * @param variables 
 * @param exclusions 
 * @param v 
 */
function getFullCoverage<D extends TreeDomain>(
  lists: 		List<D>[],
  base_list : 	List<D>,
  list_domain:  ListDomain<D>,
  variables : readonly [Path<D>][number][],
  exclusions: Exclusions<D>,
  v: number,
){
  let list: List<D> = {...base_list}
  if(variables.length > v){
    //-------------------------------------------------
    // Recur until the required combination is fully covered
    //-------------------------------------------------
    const variable: Path<D> = variables[v]
    for(let c in list_domain[variable]){
      const choice = list_domain[variable][c]
      list[variable as any] = choice
      getFullCoverage(
        lists, 
        list,
        list_domain, 
        variables, 
        exclusions,
        v+1, 
      )
    }
  }else{
    //-------------------------------------------------
    // Once the required combination is fully covered, add it
    //-------------------------------------------------
    // Push only if not excluded
    if(!isExcluded(list, exclusions)){
      lists.push(list)
    }
  }
}

/**
 * Scans the required combinations and generates a Covering Array
 * @param tests 
 * @param requirements 
 */
function generateCoveringArray<D extends TreeDomain>(
	tests:        Test<D>[],
	requirements: List<D>[],
){
	for(const req of requirements){
		// Check for existence
		const keys 		= Object.keys(req)
		const exists 	= tests.some(test => {
			// Check for rows where all factors of the combination match
			return keys.every(key => test[key] === req[key])
		})
		if(exists){
			//---------------------------------------------------------
			// If there is a row that meets req, proceed to the next req
			//---------------------------------------------------------
			continue;
		}else{
			//---------------------------------------------------------
			// Check if there is a row where req can be satisfied by appending cells
			//---------------------------------------------------------
			const appendables = tests
				.map((test,t) => {
					return {
						index: t,
						...test,
					}
				})
				.filter(test => {
					// Check for available factors
					return keys.some(key => test[key] === undefined)
				})
				.filter(test => {
					// Check that there are no factors that do not match the required ones
					return !keys.some(key => (test[key] && test[key] !== req[key]))
				})
			
			if(appendables.length > 0){
				// Append cells
				const index_to_append	= appendables[0].index
				for(const key of keys){
					if(!tests[index_to_append][key]){
						tests[index_to_append][key] = req[key]
					}
				}
			}else{
				// Add a row
				let new_test = {}
				for(const key of keys){
					new_test[key] = req[key]
				}
				tests.push(new_test)
			}
		}
	}
}

/**
 * Fills empty cells in a Covering Array with default values
 */
function applyBaseTestToCoveringArray<D extends TreeDomain>(
	tests:        Test<D>[],
	base_test:    Test<D>,
){
	const keys = Object.keys(base_test)
	for(const t in tests){
		for(const key of keys){
			if(!tests[t][key]){
				// If the cell is empty, fill it with the default value
				tests[t][key] = base_test[key]
			}
		}
	}
}

/**
 * Checks if a testcase matches conditions for exclusion
 * @param test 
 * @param exclusions 
 * @returns 
 */
function isExcluded<D extends TreeDomain>(
  test:         Test<D>,
  exclusions:   Exclusions<D>,
){
  return exclusions.some((exclusion) => {
    // Check if there is at least one matching exclusion condition
    return Object.keys(exclusion).every((key)=>{
		// Check if all conditions within the exclusion match
      if(exclusion[key] instanceof RegExp){
        // Check if the regular expression matches
        return (exclusion[key]).test(test[key])
      }else{
        // Check if the strings match
        return test[key] === exclusion[key]
      }
    })
  })
}

/**
 * Type guard for the endpoint of TreeDomain
 * @param a
 */
 function isLeafOfTreeDomain(a: unknown) : a is readonly string[]{
  return Array.isArray(a) || typeof a === 'string'
}

/**
 * Type guard for the endpoint of a Tree
 * @param a
 */
function isLeafOfTree<D extends TreeDomain>(a: unknown) : a is D[string][number]{
  return !Array.isArray(a) && typeof a === 'string'
}

/**
 * Converts a complete set of test cases into a two-dimensional array
 * @param tests 
 */
function toTable<D extends TreeDomain>(test_domain: ListDomain<D>, tests : List<D>[], true_symbol:string = 'T', false_symbol:string = 'F'):string[][]{
	const keys = Object.keys(test_domain)
	let table : string[][] = []
	//------------------------------------
	// Header part
	//------------------------------------
	for(const key of keys){
		for(const value of test_domain[key]){
			table.push([key,value])
		}
	}
	//------------------------------------
	// Body part
	//------------------------------------
	for(const row of table){
		const key = row[0]
		const val = row[1]
		for(const test of tests){
			row.push(test[key] === val ? true_symbol : false_symbol)
		}
	}
	return table
}

/**
 * Converts a two-dimensional array into a markdown table
 * @param tests 
 */
function toMarkdown<D extends TreeDomain>(table: string[][]):string{
	let result = '';
	if(table.length > 0){
		const rows_num 	= table.length
		const cols_num 	= table[0].length
		const tests_num = cols_num - 2;
		//--------------------------
		// Header part
		//--------------------------
		result += `|||`;
		for(let t=0; t<tests_num; t++){
			result += `#${t+1}|`
		}
		result += '\r\n'
		result += '|'
		result += '--|'.repeat(cols_num)
		result += '\r\n'
		//--------------------------
		// Body part
		//--------------------------
		let written_keys = []
		for(let r=0; r<rows_num; r++){
			result += '|'
			for(let c=0; c<cols_num; c++){
				if(c === 0){
					//----------------------------------------------------------
					// Only factor columns, processing to ensure the same value is not written out twice
					//----------------------------------------------------------
					if(written_keys.includes(table[r][c])){
						// If the factor has already been written out,
						// write out nothing
						result += `|`
					}else{
						// If the factor has not been written out,
						// record that it has been written
						written_keys.push(table[r][c])
						result += `${table[r][c]}|`
					}
				}else{
					result += `${table[r][c]}|`
				}
			}
			result += '\r\n'
		}
	}
	return result
}