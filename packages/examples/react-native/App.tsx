import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import {
  ok, err, isSuccess, isFailure,
  FString, FEmail, FInt, FId,
  Entity, SchemaBuilder, ServiceBase,
} from "tyforge";
import type { ISchema, InferProps, InferJson, IEntityProps, Result } from "tyforge";
import { Exceptions } from "tyforge/exceptions";
import { ServiceHttp } from "@tyforge/http";
import type { THttpResult } from "@tyforge/http";

type TTestResult = { name: string; pass: boolean };

// Entity test — same pattern as bank project
const userSchema = {
  id: { type: FId, required: false },
  name: { type: FString },
  email: { type: FEmail },
} satisfies ISchema;

type TUserProps = InferProps<typeof userSchema>;
type TUserJson = InferJson<typeof userSchema>;

const userValidator = SchemaBuilder.compile(userSchema);

class UserEntity extends Entity<TUserProps & IEntityProps, TUserJson> implements TUserProps {
  readonly id: FId | undefined;
  readonly name: FString;
  readonly email: FEmail;

  protected readonly _classInfo = { name: "UserEntity", version: "1.0.0", description: "Test user" };

  private constructor(props: TUserProps) {
    super();
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
  }

  static create(data: { name: FString; email: FEmail }): Result<UserEntity, Exceptions> {
    return ok(new UserEntity({ id: FId.generate(), name: data.name, email: data.email }));
  }

  static assign(data: TUserJson): Result<UserEntity, Exceptions> {
    const result = userValidator.assign(data);
    if (isFailure(result)) return result;
    return ok(new UserEntity(result.value));
  }
}

// ServiceHttp test — verifies class hierarchy resolves in Hermes
class TestApi extends ServiceHttp {
  protected readonly _classInfo = { name: "TestApi", version: "1.0.0", description: "Test API" };
  readonly endpoint = FString.createOrThrow("https://api.test.com") as any;

  protected async getAuthHeaders() {
    return ok({} as Record<string, FString>);
  }
}

function runTests(): TTestResult[] {
  const results: TTestResult[] = [];

  // Result pattern
  const success = ok(42);
  results.push({ name: "ok/isSuccess", pass: isSuccess(success) && success.value === 42 });
  results.push({ name: "err/isFailure", pass: isFailure(err(new Error("test"))) });

  // TypeFields
  const str = FString.create("hello");
  results.push({ name: "FString.create", pass: isSuccess(str) && str.value.getValue() === "hello" });
  results.push({ name: "FEmail.create valid", pass: isSuccess(FEmail.create("user@test.com")) });
  results.push({ name: "FEmail rejects invalid", pass: isFailure(FEmail.create("invalid")) });
  results.push({ name: "FInt.create", pass: isSuccess(FInt.create(42)) });

  // SchemaBuilder
  const schema = SchemaBuilder.compile({ name: { type: FString }, email: { type: FEmail } });
  results.push({ name: "SchemaBuilder.create valid", pass: isSuccess(schema.create({ name: "Alice", email: "alice@test.com" })) });
  results.push({ name: "SchemaBuilder rejects invalid", pass: isFailure(schema.create({ name: "", email: "bad" })) });

  // Entity — the pattern that crashed in 0.2.3
  const user = UserEntity.create({ name: FString.createOrThrow("Alice"), email: FEmail.createOrThrow("alice@test.com") });
  results.push({ name: "Entity.create", pass: isSuccess(user) });
  results.push({ name: "Entity.toJSON", pass: isSuccess(user) && typeof user.value.toJSON().name === "string" });

  // Entity assign (hydration)
  const assigned = UserEntity.assign({ id: "019d0863-5d45-7246-b6d0-de5098bfd12e", name: "Bob", email: "bob@test.com" });
  results.push({ name: "Entity.assign", pass: isSuccess(assigned) });

  // ServiceHttp class resolves (no Super expression error)
  try {
    const api = new TestApi();
    results.push({ name: "ServiceHttp instantiation", pass: api instanceof ServiceBase });
  } catch {
    results.push({ name: "ServiceHttp instantiation", pass: false });
  }

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
