import {
  ok, err, isSuccess, isFailure,
  map, flatMap, fold, match, getOrElse, orElse, all, toPromise,
  OK_TRUE, OK_FALSE,
  FEmail,
} from "tyforge";
import type { Result } from "tyforge";

console.log("=== Result Pattern ===\n");

// ok e err
const success = ok(42);
const failure = err("algo deu errado");
console.log("ok:", success);
console.log("err:", failure);

// isSuccess / isFailure
console.log("isSuccess:", isSuccess(success)); // true
console.log("isFailure:", isFailure(failure)); // true

// map — transforma o valor de sucesso
const doubled = map(success, (v) => v * 2);
console.log("map:", doubled); // { success: true, value: 84 }

// flatMap — encadeia operações que retornam Result
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err("divisão por zero");
  return ok(a / b);
}
const chained = flatMap(ok(10), (v) => divide(v, 2));
console.log("flatMap:", chained); // { success: true, value: 5 }

// fold — reduz a um valor
const message = fold(
  success,
  (v) => `sucesso: ${v}`,
  (e) => `erro: ${e}`,
);
console.log("fold:", message); // "sucesso: 42"

// match — pattern matching
const matched = match(failure, {
  success: (v) => `ok: ${v}`,
  failure: (e) => `falhou: ${e}`,
});
console.log("match:", matched); // "falhou: algo deu errado"

// getOrElse — valor padrão
const value = getOrElse(failure, 0);
console.log("getOrElse:", value); // 0

// getOrElse com lazy default
const lazy = getOrElse(failure, () => 99);
console.log("getOrElse lazy:", lazy); // 99

// orElse — fallback para outro Result
const fallback = orElse(failure, ok(100));
console.log("orElse:", fallback); // { success: true, value: 100 }

// all — combina array de Results
const results = [ok(1), ok(2), ok(3)];
const combined = all(results);
console.log("all:", combined); // { success: true, value: [1, 2, 3] }

const withError = [ok(1), err("fail"), ok(3)];
const failed = all(withError);
console.log("all com erro:", failed); // { success: false, error: "fail" }

// OK_TRUE / OK_FALSE — singletons
console.log("OK_TRUE:", OK_TRUE);
console.log("OK_FALSE:", OK_FALSE);

// toPromise
toPromise(ok("async value")).then((v) => console.log("toPromise:", v));

// Uso real com TypeField
const emailResult = FEmail.create("test@example.com");
const emailValue = fold(
  emailResult,
  (email) => email.getValue(),
  (error) => `erro: ${error.detail}`,
);
console.log("\nFEmail via fold:", emailValue);

console.log("\n✅ Exemplo 08 concluído");
