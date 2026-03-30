import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import {
  ok, err, isSuccess, isFailure,
  FString, FEmail, FInt,
  SchemaBuilder,
} from "tyforge";

type TTestResult = { name: string; pass: boolean };

function runTests(): TTestResult[] {
  const results: TTestResult[] = [];

  const success = ok(42);
  results.push({ name: "ok/isSuccess", pass: isSuccess(success) && success.value === 42 });

  const failure = err(new Error("test"));
  results.push({ name: "err/isFailure", pass: isFailure(failure) });

  const str = FString.create("hello");
  results.push({ name: "FString.create", pass: isSuccess(str) && str.value.getValue() === "hello" });

  const email = FEmail.create("user@test.com");
  results.push({ name: "FEmail.create valid", pass: isSuccess(email) });

  const badEmail = FEmail.create("invalid");
  results.push({ name: "FEmail rejects invalid", pass: isFailure(badEmail) });

  const num = FInt.create(42);
  results.push({ name: "FInt.create", pass: isSuccess(num) && num.value.getValue() === 42 });

  const schema = SchemaBuilder.compile({
    name: { type: FString },
    email: { type: FEmail },
  });

  const valid = schema.create({ name: "Alice", email: "alice@test.com" });
  results.push({ name: "SchemaBuilder.create valid", pass: isSuccess(valid) });

  const invalid = schema.create({ name: "", email: "bad" });
  results.push({ name: "SchemaBuilder rejects invalid", pass: isFailure(invalid) });

  return results;
}

export default function App() {
  const [results, setResults] = useState<TTestResult[]>([]);

  useEffect(() => {
    setResults(runTests());
  }, []);

  const allPass = results.length > 0 && results.every((r) => r.pass);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TyForge React Native Test</Text>
      <Text style={[styles.status, { color: allPass ? "#22c55e" : "#ef4444" }]}>
        {allPass ? "ALL PASS" : "RUNNING..."}
      </Text>
      <ScrollView style={styles.list}>
        {results.map((r, i) => (
          <Text key={i} style={[styles.item, { color: r.pass ? "#22c55e" : "#ef4444" }]}>
            {r.pass ? "\u2713" : "\u2717"} {r.name}
          </Text>
        ))}
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111", paddingTop: 60, paddingHorizontal: 20 },
  title: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  status: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  list: { flex: 1 },
  item: { color: "#ccc", fontSize: 16, marginBottom: 6 },
});
