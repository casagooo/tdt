//=============================================================================================================
//	Common Types
//=============================================================================================================
/**
 * CoveringArrayの強度指定用
 */
type CoveringStrength = 0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19

/**
 * 再帰による繰り返しのなかで、インデックスとして利用される型
 * 参考： https://stackoverflow.com/questions/58434389/typescript-deep-keyof-of-a-nested-object
 */	
 type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
	11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]]

/**
 * 2つの文字列を1つの文字列に連結する
 * 参考： https://stackoverflow.com/questions/58434389/typescript-deep-keyof-of-a-nested-object
 */
type Join<K, P> = 
	K extends string | number
		?	P extends string | number
			?	`${K}${"" extends P ? "" : "."}${P}`
			: never
		: never;

/**
 * オブジェクトの末端要素を取得できるパス（キーを.で連結）
 * D extends number = 10にした場合、
 * Error: Type instantiation is excessively deep and possibly infinite.(2589)
 * というエラーが発生するため、6に減らしている。
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
export type Path<T, D extends number = 6> = 
	[D] extends [never] 
		? never 
		: T extends readonly string[]
			? ""
			:	{ [K in keyof T]-?: Join<K, Path<T[K], Prev[D]>> }[keyof T] 

/**
 * オブジェクトの末端要素の型
 * // 例
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
 * キーにKが含まれることを確約する
 */
type With<T,K extends string> = 
	K extends keyof T ? T : never;

/**
 * ツリー構造のオブジェクトがとりうる範囲、定義域を示すオブジェクト
 */
export type TreeDomain = {
	[key: string]: TreeDomain | readonly string[]
};

/**
 * ツリー構造のオブジェクトの具体的な値を示すオブジェクト
 */
export type Tree<D extends TreeDomain> = {
	// for in で利用できるように Extract<keyof D, string> としている
	[KEY in Extract<keyof D, string>]: 
		D[KEY] extends TreeDomain
			? Tree<D[KEY]>
			: D[KEY][number]
};

/**
 * リスト構造のオブジェクトの具体的な値を示すオブジェクトを、1階層に書き下したもの。
 * キーは`Given.ユーザ.種別`などのように`.`で連結される。
 */
export type ListDomain<D extends TreeDomain> = {
	[KEY in Path<D>]? : Leaf<D, KEY>
};

/**
 * リスト構造のオブジェクトの具体的な値を示すオブジェクトを、1階層に書き下したもの。
 * キーは`Given.ユーザ.種別`などのように`.`で連結される。
 * キーはrequiredではない。
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
 * テストケースを構成する変数のデフォルト値
 */
export type Defaults<D extends TreeDomain> = Tree<D>

/**
 * テストケース
 */
export type Test<D extends TreeDomain> = List<D>

/**
 * テストケースを展開する観点
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
 * テストケースを展開する観点の一式
 */
export type Perspectives<D extends TreeDomain> = readonly Perspective<D>[]

/**
 * テストケースにおいて、除外する条件の組み合わせ
 * これが成立するテストケースは除外される。
 */
type Exclusion<D extends TreeDomain> = {
	readonly [KEY in Path<D>]?: Leaf<D, KEY> extends readonly string[]
    ? Leaf<D, KEY>[number] | RegExp
    : never
}

/**
 * テストケースにおいて、除外する条件の一式
 */
export type Exclusions<D extends TreeDomain> = readonly Exclusion<D>[]

/**
 * ファイル出力オプション
 */
export type FileOutputOption = {
	json? : {
		file_path :string
	},
	markdown? : {
		file_path: string,
		true_symbol?: string,
		false_symbol?: string,
	}
}

//=============================================================================================================
//	Functions
//=============================================================================================================
/**
 * テストケース一式を生成する。
 * @param domain 
 * @param defaults 
 * @param exclusions 
 * @param perspectives 
 * @returns 
 */
export function generateTests<D extends TreeDomain>(
  domain:  				D,
  defaults: 			Defaults<D>, 
  exclusions:   		Exclusions<D>,
  perspectives: 		Perspectives<D>, 
  file_out_option?:		FileOutputOption,
){
  // 全パラメータを取得（例： "Given.ユーザ.種別", "When.ブラウザ.起動.する"）
  let list_domain:ListDomain<D> = {}
  treeDomainToListDomain<D>(list_domain, domain)

  // デフォルトのテストケースを作成
  let list_default:List<D> = {}
  treeToList<D>(list_default, defaults)

  // テスト一覧を作成
  let tests:Test<D>[] = []
  for(let perspective of perspectives){
    //------------------------------------------------
    // ある観点について展開
    //------------------------------------------------
    //------------------------------------------------
    // 定数をベースのテストケースに反映する
    //------------------------------------------------
    let base_test : Test<D> = {...list_default}
    for(let key in perspective.constants){
      base_test[key] = perspective.constants[key]
    }
    //------------------------------------------------
    // 変数を展開し、テストケースに反映する
    //------------------------------------------------
    tests = [
			...tests,
			...generateTestsByPerspective<D>(
				list_domain,
				perspective, 
				base_test, 
				exclusions,
			)
		]
  }

  // 全テストケースにIDを付与
  let id = 1
  for(let t in tests){
    tests[t].ID = `${id}`
    id++
  }
  //-----------------------------------------------------
  // ファイル出力
  //-----------------------------------------------------
  if(file_out_option){
		const fs = require('fs')
		//-----------------------
		// JSON形式
		//-----------------------
		if(file_out_option.json){
			fs.writeFile(`./${file_out_option.json.file_path}`, 
				JSON.stringify(tests, null, '\t'), 
				(err) => {if(err)console.log(err)}
			);
		}
		//-----------------------
		// マークダウン形式
		//-----------------------
		if(file_out_option.markdown){
			// テーブルへの変換
			fs.writeFile(`./${file_out_option.markdown.file_path}`, 
				toMarkdown(toTable(
					list_domain,
					tests, 
					file_out_option.markdown.true_symbol, 
					file_out_option.markdown.false_symbol
				)), 
				(err) => {if(err)console.log(err)}
			);
		}
	}

  return tests
}

/**
 * 変数を、TreeDomain型からListDomain型に、変換する。
 * データ構造を、ツリー状からリスト状（1次元連想配列）に変換するが、
 * 末端（葉）の構造は変化しない（Stringの配列）。
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
      // 末端なので、選択肢を登録
			if(typeof result[path] !== "undefined"){
				throw Error('重複する定義が存在しています。')
			}
      result[path] = value
    }else{
      // さらに深く再帰的に展開
      treeDomainToListDomain(result, value, path)
    }
  }
}

/**
 * 変数を、Tree型からList型に、変換する。
 * データ構造を、ツリー状からリスト状（1次元連想配列）に変換するが、
 * 末端（葉）の構造は変化しない（String）。
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
      // 末端なので、値を登録
			if(typeof result[path] !== "undefined"){
				throw Error('重複する定義が存在しています。')
			}
      result[path] = value
    }else{
      // さらに深く再帰的に展開
      treeToList(result, value, path)
    }
  }
}

/**
 * 観点をもとにテストケースを生成する。
 * 再帰関数。
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
		// 1. 網羅すべき組み合わせ一式を取得
		//---------------------------------------------------
		let requirements: List<D>[] = getRequirements(
			list_domain,
			perspective, 
			exclusions,
		)
		//---------------------------------------------------
		// 2. 被覆配列(CoveringArray)を生成
		//---------------------------------------------------
		let tests: Test<D>[] = [];
		generateCoveringArray(tests, requirements)
		//---------------------------------------------------
		// 3. 空きセルにデフォルト値を追記
		//---------------------------------------------------
		applyBaseTestToCoveringArray(tests, base_test)

		//---------------------------------------------------
		// 4. 禁則があてはまるテストは除外
		//---------------------------------------------------
		tests = tests.filter(test => {
			return !isExcluded(test, exclusions)
		})
		//---------------------------------------------------
		// 5. 観点名(Perspective) と 期待結果(Then) の追記
		//---------------------------------------------------
		for(const t in tests){
			// 観点名を追記
			tests[t]["Perspective"] = perspective.title.replace(/\(/gi,'（').replace(/\)/gi,'）')
			// 期待結果を追記
			perspective.expect(tests[t])
		}
		// 返却
		return tests
}

function getRequirements<D extends TreeDomain>(
  list_domain:  ListDomain<D>,
  perspective : Perspective<D>,
  exclusions: Exclusions<D>,
):List<D>[]{
	// 実行時入力チェック
	if(perspective.strength > perspective.variables.length){
		throw new Error("Coverage strength must be less than the length of variables.")
	}

	// 強度を判断
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
 * 入力配列をもとに、指定した要素数で構成される、サブセット配列一式を取得する
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
 * variablesについての完全網羅リストを取得する
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
    // 満たすべき組み合わせが網羅されるまで再帰
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
    // 満たすべき組み合わせが網羅されたので、追加する
    //-------------------------------------------------
    // 禁則があてはまらない場合のみ、プッシュ
    if(!isExcluded(list, exclusions)){
      lists.push(list)
    }
  }
}

/**
 * 網羅すべき組み合わせを走査し、被覆配列（CoveringArray）を生成する
 * @param tests 
 * @param requirements 
 */
function generateCoveringArray<D extends TreeDomain>(
	tests:        Test<D>[],
	requirements: List<D>[],
){
	for(const req of requirements){
		// 既存かチェック
		const keys 		= Object.keys(req)
		const exists 	= tests.some(test => {
			// 組み合わせの全ての因子が一致する行
			return keys.every(key => test[key] === req[key])
		})
		if(exists){
			//---------------------------------------------------------
			// reqを満たす行がある場合、次のreqへ
			//---------------------------------------------------------
			continue;
		}else{
			//---------------------------------------------------------
			// セル追記によってreqを満たせるようになる行が存在するか
			//---------------------------------------------------------
			const appendables = tests
				.map((test,t) => {
					return {
						index: t,
						...test,
					}
				})
				.filter(test => {
					// 求められる因子に空きがある
					return keys.some(key => test[key] === undefined)
				})
				.filter(test => {
					// 求められる因子と不一致の因子がない
					return !keys.some(key => (test[key] && test[key] !== req[key]))
				})
			
			if(appendables.length > 0){
				// セル追記
				const index_to_append	= appendables[0].index
				for(const key of keys){
					if(!tests[index_to_append][key]){
						tests[index_to_append][key] = req[key]
					}
				}
			}else{
				// 行追加
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
 * 被覆配列の空きセルを、デフォルト値で埋める
 */
function applyBaseTestToCoveringArray<D extends TreeDomain>(
	tests:        Test<D>[],
	base_test:    Test<D>,
){
	const keys = Object.keys(base_test)
	for(const t in tests){
		for(const key of keys){
			if(!tests[t][key]){
				// 空きセルの場合は、デフォルト値で埋める
				tests[t][key] = base_test[key]
			}
		}
	}
}

/**
 * テストケースが除外される条件に合致するか確認
 * @param test 
 * @param exclusions 
 * @returns 
 */
function isExcluded<D extends TreeDomain>(
  test:         Test<D>,
  exclusions:   Exclusions<D>,
){
  return exclusions.some((exclusion) => {
    // 合致する除外条件が1つでもあるか確認
    return Object.keys(exclusion).every((key)=>{
      // 除外条件内の全ての条件が合致するか確認
      if(exclusion[key] instanceof RegExp){
        // 正規表現が合致
        return (exclusion[key]).test(test[key])
      }else{
        // 文字列が一致
        return test[key] === exclusion[key]
      }
    })
  })
}

/**
 * TreeDomainの末端 型ガード
 * @param a
 */
 function isLeafOfTreeDomain(a: unknown) : a is readonly string[]{
  return Array.isArray(a) || typeof a === 'string'
}

/**
 * Treeの末端 型ガード
 * @param a
 */
function isLeafOfTree<D extends TreeDomain>(a: unknown) : a is D[string][number]{
  return !Array.isArray(a) && typeof a === 'string'
}

/**
 * テストケース一式を2次元配列に変換する
 * @param tests 
 */
function toTable<D extends TreeDomain>(test_domain: ListDomain<D>, tests : List<D>[], true_symbol:string = 'T', false_symbol:string = 'F'):string[][]{
	const keys = Object.keys(test_domain)
	let table : string[][] = []
	//------------------------------------
	// ヘッダー部分
	//------------------------------------
	for(const key of keys){
		for(const value of test_domain[key]){
			table.push([key,value])
		}
	}
	//------------------------------------
	// ボディ部分
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
 * 2次元配列をマークダウンのテーブルに変換する
 * @param tests 
 */
function toMarkdown<D extends TreeDomain>(table: string[][]):string{
	let result = '';
	if(table.length > 0){
		const rows_num 	= table.length
		const cols_num 	= table[0].length
		const tests_num = cols_num - 2;
		//--------------------------
		// ヘッダー部分
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
		// ボディ部分
		//--------------------------
		let written_keys = []
		for(let r=0; r<rows_num; r++){
			result += '|'
			for(let c=0; c<cols_num; c++){
				if(c === 0){
					//----------------------------------------------------------
					// 因子列のみ、同じ値を二度は書き出さないための処理
					//----------------------------------------------------------
					if(written_keys.includes(table[r][c])){
						// 書き出したことのある因子の場合は、
						// 何も書き出さない
						result += `|`
					}else{
						// 書き出したことのない因子の場合は、
						// 書き出したことを記録する
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