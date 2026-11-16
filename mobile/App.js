import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { request, normalizeServer, decimalInput } from "./src/api";
import { sections, money, quantity, dateTime } from "./src/schema";

const SESSION_KEY = "eletrostock_session_v1";
const SERVER_KEY = "eletrostock_server_v1";
const palette = {
  ink: "#17382f",
  green: "#075f50",
  lime: "#c8f16c",
  muted: "#70837a",
  line: "#e0e8e2",
  paper: "#f4f7f4",
  white: "#fff",
  warning: "#99671b",
  red: "#ad352e",
};
function defaultServer() {
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return host && !host.includes("exp.direct") ? "http://" + host + ":8001" : "";
}
const readStored = (key) =>
  Platform.OS === "web" ? Promise.resolve(null) : SecureStore.getItemAsync(key);
const writeStored = (key, value) =>
  Platform.OS === "web"
    ? Promise.resolve()
    : SecureStore.setItemAsync(key, value);
const deleteStored = (key) =>
  Platform.OS === "web" ? Promise.resolve() : SecureStore.deleteItemAsync(key);
function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
  style,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        disabled && { opacity: 0.5 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: palette.green }]}>
        {children}
      </Text>
    </Pressable>
  );
}
function ErrorBox({ message }) {
  return message ? (
    <View accessibilityRole="alert" style={styles.errorBox}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  ) : null;
}
function Brand({ dark = false }) {
  return (
    <View style={styles.brandRow}>
      <Text style={styles.bolt}>ϟ</Text>
      <Text style={[styles.brand, dark && { color: "white" }]}>
        EletroStock
      </Text>
    </View>
  );
}
function Empty({ text = "Nenhum registro encontrado." }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>◫</Text>
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}
function Badge({ children, warn = false }) {
  return (
    <View style={[styles.badge, warn && styles.badgeWarn]}>
      <Text style={[styles.badgeText, warn && { color: palette.warning }]}>
        {children}
      </Text>
    </View>
  );
}
function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={palette.green} />
    </View>
  );
}

function Login({ onLogin, initialServer, initialMessage }) {
  const [base, setBase] = useState(initialServer || defaultServer());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialMessage || "");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (busy) return;
    if (!username.trim() || !password) {
      setError("Informe usuário e senha.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const server = normalizeServer(base);
      const result = await request(server, "auth/login/", {
        method: "POST",
        data: { username: username.trim(), password },
      });
      await onLogin({ base: server, token: result.token, user: result.user });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <SafeAreaView style={styles.loginBg}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.loginWrap}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.loginCard}>
            <Brand />
            <Text style={styles.eyebrow}>MATERIAIS ELÉTRICOS · MOBILE</Text>
            <Text style={styles.loginTitle}>
              Seu estoque,{"\n"}sempre à mão.
            </Text>
            <Text style={styles.muted}>
              Entre com a mesma conta do EletroStock.
            </Text>
            <Text style={styles.label}>Endereço do computador</Text>
            <TextInput
              accessibilityLabel="Endereço do servidor"
              value={base}
              onChangeText={setBase}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="http://192.168.1.10:8001"
              style={styles.input}
            />
            <Text style={styles.help}>
              Use o endereço exibido em INICIAR_API_MOBILE.bat. Celular e
              computador no mesmo Wi-Fi.
            </Text>
            <Text style={styles.label}>Usuário</Text>
            <TextInput
              accessibilityLabel="Usuário"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              style={styles.input}
            />
            <Text style={styles.label}>Senha</Text>
            <TextInput
              accessibilityLabel="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              style={styles.input}
              onSubmitEditing={submit}
            />
            <ErrorBox message={error} />
            <Button disabled={busy} onPress={submit} style={{ marginTop: 20 }}>
              {busy ? "Conectando..." : "Entrar no sistema →"}
            </Button>
            <Text style={styles.loginFoot}>
              Usinas & indústrias · Gestão de materiais
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
function Home({ api, navigate }) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true);
  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      setData(await api("dashboard/"));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [api]);
  useEffect(() => {
    load();
  }, [load]);
  const width = useWindowDimensions().width;
  if (!data && busy) return <Loading />;
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={busy}
          onRefresh={load}
          tintColor={palette.green}
        />
      }
    >
      <Text style={styles.eyebrow}>OPERAÇÃO / VISÃO GERAL</Text>
      <Text style={styles.title}>
        Estoque em foco<Text style={styles.green}>.</Text>
      </Text>
      <Text style={styles.muted}>Os materiais certos, na hora certa.</Text>
      <ErrorBox message={error} />
      {!data && error ? <Button onPress={load}>Tentar novamente</Button> : null}
      {data && (
        <>
          <View style={styles.stats}>
            {[
              ["Materiais", String(data.materiais), "Catálogo de materiais"],
              [
                "Abaixo do mínimo",
                String(data.baixo_estoque),
                "Atenção à reposição",
              ],
              ["Valor estimado", money(data.valor), "Saldo × custo cadastrado"],
              [
                "Fornecedores",
                String(data.fornecedores),
                "Parceiros de abastecimento",
              ],
            ].map(([label, value, hint], i) => (
              <Pressable
                accessibilityRole="button"
                key={label}
                style={[
                  styles.stat,
                  { width: width > 650 ? "23.5%" : "48%" },
                  i === 1 && styles.statWarn,
                ]}
                onPress={() =>
                  navigate({
                    type: "list",
                    section: i === 3 ? "fornecedores" : "materiais",
                    low: i === 1,
                  })
                }
              >
                <Text style={styles.statLabel}>{label}</Text>
                <Text
                  style={[
                    styles.statValue,
                    i === 2 && { fontSize: 23 },
                    i === 1 && { color: palette.warning },
                  ]}
                >
                  {value}
                </Text>
                <Text style={styles.statHint}>{hint}</Text>
              </Pressable>
            ))}
          </View>
          <Button
            onPress={() => navigate({ type: "form", section: "movimentacoes" })}
          >
            + Registrar movimentação
          </Button>
          <View style={styles.sectionHead}>
            <Text style={styles.h2}>Reposição necessária</Text>
            <Pressable
              onPress={() =>
                navigate({ type: "list", section: "materiais", low: true })
              }
            >
              <Text style={styles.link}>Ver todos →</Text>
            </Pressable>
          </View>
          <View style={styles.panel}>
            {data.alertas.length ? (
              data.alertas.map((item) => (
                <Record
                  key={item.id}
                  item={item}
                  section="materiais"
                  onPress={() =>
                    navigate({
                      type: "detail",
                      section: "materiais",
                      id: item.id,
                    })
                  }
                />
              ))
            ) : (
              <Empty text="Tudo em dia! Nenhum material abaixo do mínimo." />
            )}
          </View>
          <View style={styles.sectionHead}>
            <Text style={styles.h2}>Últimas movimentações</Text>
            <Pressable
              onPress={() =>
                navigate({ type: "list", section: "movimentacoes" })
              }
            >
              <Text style={styles.link}>Ver todas →</Text>
            </Pressable>
          </View>
          <View style={styles.panel}>
            {data.recentes.length ? (
              data.recentes.map((item) => (
                <Record
                  key={item.id}
                  item={item}
                  section="movimentacoes"
                  onPress={() =>
                    navigate({
                      type: "detail",
                      section: "movimentacoes",
                      id: item.id,
                    })
                  }
                />
              ))
            ) : (
              <Empty text="Registre sua primeira entrada de material." />
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
function Record({ item, section, onPress }) {
  const title = section === "movimentacoes" ? item.material_nome : item.nome;
  let subtitle =
    section === "materiais"
      ? [item.codigo, item.categoria_nome, item.localizacao]
          .filter(Boolean)
          .join(" · ")
      : section === "movimentacoes"
        ? item.referencia
        : section === "fornecedores"
          ? item.cnpj
          : item.descricao;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={"Abrir " + title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.record,
        pressed && { backgroundColor: "#f0f6ee" },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.recordTitle}>{title}</Text>
        <Text numberOfLines={2} style={styles.recordSub}>
          {subtitle || "Sem descrição"}
        </Text>
        {section === "movimentacoes" && (
          <Text style={styles.recordSub}>{dateTime(item.criado_em)}</Text>
        )}
      </View>
      <View style={styles.recordRight}>
        {section === "materiais" ? (
          <>
            <Badge warn={item.baixo_estoque}>
              {quantity(item.saldo)} {item.unidade}
            </Badge>
            {item.baixo_estoque && (
              <Text style={styles.lowText}>Estoque baixo</Text>
            )}
          </>
        ) : section === "movimentacoes" ? (
          <Badge warn={item.tipo === "S"}>
            {item.tipo_nome} · {quantity(item.quantidade)}
          </Badge>
        ) : (
          <Text style={styles.chevron}>›</Text>
        )}
      </View>
    </Pressable>
  );
}
function ListScreen({ section, low = false, api, navigate }) {
  const schema = sections[section];
  const [q, setQ] = useState(""),
    [search, setSearch] = useState(""),
    [onlyLow, setOnlyLow] = useState(low),
    [data, setData] = useState(null),
    [page, setPage] = useState(1),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(q.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    requestData();
    async function requestData() {
      try {
        const result = await api(
          section +
            "/?q=" +
            encodeURIComponent(search) +
            "&page=" +
            page +
            (onlyLow ? "&baixo=1" : ""),
          { signal: controller.signal },
        );
        if (!controller.signal.aborted) setData(result);
      } catch (e) {
        if (!controller.signal.aborted) setError(e.message);
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }
    return () => controller.abort();
  }, [api, section, search, page, onlyLow, revision]);
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.listHeader}>
        <Text style={styles.eyebrow}>CONTROLE DE ESTOQUE</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{schema.title}</Text>
          <Button onPress={() => navigate({ type: "form", section })}>
            + Novo
          </Button>
        </View>
        <TextInput
          accessibilityLabel="Pesquisar registros"
          placeholder="Pesquisar por nome..."
          value={q}
          onChangeText={setQ}
          style={styles.search}
        />
        {section === "materiais" && (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: onlyLow }}
            onPress={() => {
              setOnlyLow(!onlyLow);
              setPage(1);
            }}
            style={styles.filter}
          >
            <Text
              style={[styles.filterText, onlyLow && { color: palette.green }]}
            >
              {onlyLow ? "☑" : "☐"} Apenas estoque baixo
            </Text>
          </Pressable>
        )}
        <Text style={styles.help}>
          {data
            ? data.count + " registro(s) encontrado(s)"
            : "Carregando registros..."}
        </Text>
        <ErrorBox message={error} />
        {error && (
          <Button secondary onPress={() => setRevision((x) => x + 1)}>
            Tentar novamente
          </Button>
        )}
      </View>
      {busy && !data ? (
        <Loading />
      ) : (
        <FlatList
          data={data?.results || []}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.listBody}
          renderItem={({ item }) => (
            <View style={styles.listCard}>
              <Record
                item={item}
                section={section}
                onPress={() =>
                  navigate({ type: "detail", section, id: item.id })
                }
              />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={busy}
              onRefresh={() => setRevision((x) => x + 1)}
              tintColor={palette.green}
            />
          }
          ListEmptyComponent={
            <Empty
              text={
                search
                  ? "Nenhum registro para esta pesquisa."
                  : "Nenhum registro cadastrado."
              }
            />
          }
          ListFooterComponent={
            data ? (
              <View style={styles.pagination}>
                <Button
                  secondary
                  disabled={page <= 1 || busy}
                  onPress={() => setPage((p) => p - 1)}
                >
                  ←
                </Button>
                <Text style={styles.muted}>
                  {data.page} de {data.pages}
                </Text>
                <Button
                  secondary
                  disabled={page >= data.pages || busy}
                  onPress={() => setPage((p) => p + 1)}
                >
                  →
                </Button>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
function DetailScreen({ section, id, api, navigate }) {
  const [item, setItem] = useState(null),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    api(section + "/" + id + "/")
      .then((x) => {
        if (active) setItem(x);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [api, section, id, revision]);
  if (!item)
    return error ? (
      <View style={styles.content}>
        <ErrorBox message={error} />
        <Button
          onPress={() => {
            setError("");
            setRevision((x) => x + 1);
          }}
        >
          Tentar novamente
        </Button>
      </View>
    ) : (
      <Loading />
    );
  const fields = sections[section].fields;
  const value = (field) =>
    field.relation
      ? item[field.key + "_nome"] ||
        item[field.key + "_codigo"] ||
        item[field.key]
      : field.choices
        ? field.choices.find(([key]) => key === item[field.key])?.[1] ||
          item[field.key]
        : field.key === "preco"
          ? money(item[field.key])
          : field.decimal
            ? quantity(item[field.key])
            : item[field.key];
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>
        DETALHES / {sections[section].singular.toUpperCase()}
      </Text>
      <Text style={styles.title}>
        {item.nome || item.material_nome || item.label}
      </Text>
      {section === "materiais" && (
        <View style={[styles.balance, item.baixo_estoque && styles.statWarn]}>
          <Text style={styles.statLabel}>Saldo disponível</Text>
          <Text style={styles.statValue}>
            {quantity(item.saldo)} {item.unidade}
          </Text>
          <Badge warn={item.baixo_estoque}>
            {item.baixo_estoque
              ? "Abaixo do estoque mínimo"
              : "Estoque regular"}
          </Badge>
        </View>
      )}
      <View style={[styles.panel, { padding: 20, marginTop: 16 }]}>
        {fields.map((field) => (
          <View style={styles.detailField} key={field.key}>
            <Text style={styles.statLabel}>{field.label}</Text>
            <Text style={styles.detailValue}>
              {String(value(field) ?? "") || "—"}
            </Text>
          </View>
        ))}
        {item.criado_em && (
          <View style={styles.detailField}>
            <Text style={styles.statLabel}>Registrado em</Text>
            <Text style={styles.detailValue}>{dateTime(item.criado_em)}</Text>
          </View>
        )}
      </View>
      <Button
        style={{ marginTop: 20 }}
        onPress={() => navigate({ type: "form", section, id, item })}
      >
        Editar registro
      </Button>
      {section === "materiais" && (
        <>
          <Text style={[styles.h2, { marginVertical: 20 }]}>
            Histórico recente
          </Text>
          <View style={styles.panel}>
            {item.historico?.length ? (
              item.historico.map((m) => (
                <Record
                  key={m.id}
                  item={m}
                  section="movimentacoes"
                  onPress={() =>
                    navigate({
                      type: "detail",
                      section: "movimentacoes",
                      id: m.id,
                    })
                  }
                />
              ))
            ) : (
              <Empty text="Este material ainda não possui movimentações." />
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
function RelationPicker({ field, current, api, onSelect, onClose }) {
  const [query, setQuery] = useState(""),
    [search, setSearch] = useState(""),
    [result, setResult] = useState(null),
    [page, setPage] = useState(1),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    api(field.relation + "/?q=" + encodeURIComponent(search) + "&page=" + page)
      .then((x) => {
        if (active) setResult(x);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [api, field.relation, search, page]);
  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.page}>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.h2}>
              Selecionar {field.label.toLowerCase()}
            </Text>
            <Button secondary onPress={onClose}>
              Fechar
            </Button>
          </View>
          <TextInput
            autoFocus
            placeholder="Pesquisar..."
            accessibilityLabel="Pesquisar opção"
            value={query}
            onChangeText={setQuery}
            style={styles.search}
          />
          <ErrorBox message={error} />
        </View>
        {busy ? (
          <Loading />
        ) : (
          <FlatList
            data={result?.results || []}
            keyExtractor={(i) => String(i.id)}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.pickRow,
                  String(current) === String(item.id) && {
                    backgroundColor: "#e9f5dd",
                  },
                ]}
                onPress={() => onSelect(item)}
              >
                <Text style={styles.recordTitle}>{item.label}</Text>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Empty text="Nenhuma opção encontrada. Cadastre o registro primeiro na seção correspondente." />
            }
          />
        )}
        <View style={styles.pagination}>
          <Button
            secondary
            disabled={page <= 1 || busy}
            onPress={() => setPage((x) => x - 1)}
          >
            ←
          </Button>
          <Text style={styles.muted}>
            {result?.page || 1} de {result?.pages || 1}
          </Text>
          <Button
            secondary
            disabled={page >= (result?.pages || 1) || busy}
            onPress={() => setPage((x) => x + 1)}
          >
            →
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
function FormScreen({ section, id, item, api, onSaved }) {
  const schema = sections[section];
  const [values, setValues] = useState(() =>
      Object.fromEntries(
        schema.fields.map((f) => [
          f.key,
          String(item?.[f.key] ?? f.default ?? ""),
        ]),
      ),
    ),
    [errors, setErrors] = useState({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [picker, setPicker] = useState(null),
    [labels, setLabels] = useState(() => ({
      categoria: item?.categoria_nome,
      fornecedor: item?.fornecedor_nome,
      material: item?.material_nome,
    }));
  const set = (key, value) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const saving = useRef(false);
  async function save() {
    if (saving.current) return;
    const missing = {};
    for (const field of schema.fields)
      if (!field.optional && !String(values[field.key]).trim())
        missing[field.key] = ["Preencha este campo."];
    if (Object.keys(missing).length) {
      setErrors(missing);
      setError("Preencha os campos obrigatórios.");
      return;
    }
    saving.current = true;
    setBusy(true);
    setError("");
    setErrors({});
    try {
      const data = Object.fromEntries(
        schema.fields.map((f) => [
          f.key,
          f.decimal ? decimalInput(values[f.key]) : values[f.key],
        ]),
      );
      const saved = await api(section + "/" + (id ? id + "/" : ""), {
        method: id ? "PUT" : "POST",
        data,
      });
      onSaved(saved);
    } catch (e) {
      setError(e.message);
      setErrors(e.fields || {});
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>{schema.title.toUpperCase()}</Text>
        <Text style={styles.title}>
          {id ? "Editar" : "Novo"} {schema.singular.toLowerCase()}
        </Text>
        <Text style={styles.muted}>Campos com * são obrigatórios.</Text>
        <ErrorBox message={error} />
        {errors.__all__ && <ErrorBox message={errors.__all__.join(" ")} />}
        <View style={[styles.panel, { padding: 20, marginTop: 20 }]}>
          {schema.fields.map((field) => {
            const disabled =
              busy ||
              (!!id && section === "movimentacoes" && field.key === "material");
            return (
              <View key={field.key} style={styles.formField}>
                <Text style={styles.label}>
                  {field.label}
                  {field.optional ? "" : " *"}
                </Text>
                {field.relation ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={disabled}
                    onPress={() => setPicker(field)}
                    style={[
                      styles.input,
                      styles.select,
                      disabled && styles.disabled,
                    ]}
                  >
                    <Text
                      style={
                        values[field.key] ? styles.detailValue : styles.muted
                      }
                    >
                      {labels[field.key] ||
                        (values[field.key]
                          ? "Registro #" + values[field.key]
                          : "Selecionar...")}
                    </Text>
                    <Text style={styles.chevron}>⌄</Text>
                  </Pressable>
                ) : field.choices ? (
                  <View style={styles.choices}>
                    {field.choices.map(([key, label]) => (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{
                          checked: values[field.key] === key,
                        }}
                        key={key}
                        disabled={busy}
                        onPress={() => set(field.key, key)}
                        style={[
                          styles.choice,
                          values[field.key] === key && styles.choiceSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.choiceText,
                            values[field.key] === key && { color: "white" },
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    accessibilityLabel={field.label}
                    value={values[field.key]}
                    onChangeText={(text) =>
                      set(
                        field.key,
                        field.numeric ? text.replace(/\D/g, "") : text,
                      )
                    }
                    editable={!busy}
                    keyboardType={
                      field.decimal
                        ? "decimal-pad"
                        : field.numeric
                          ? "number-pad"
                          : field.keyboard || "default"
                    }
                    autoCapitalize={
                      field.key === "email" ? "none" : "sentences"
                    }
                    autoCorrect={field.key !== "email"}
                    multiline={field.multiline}
                    maxLength={field.maxLength}
                    style={[styles.input, field.multiline && styles.textarea]}
                    textAlignVertical={field.multiline ? "top" : "center"}
                  />
                )}
                {errors[field.key]?.map((e, i) => (
                  <Text style={styles.fieldError} key={i}>
                    {e}
                  </Text>
                ))}
              </View>
            );
          })}
          {section === "materiais" && (
            <Text style={styles.help}>
              O saldo é alterado por movimentações. Registre uma entrada depois
              de cadastrar o material.
            </Text>
          )}
          {section === "movimentacoes" && (
            <Text style={styles.help}>
              Saídas não podem deixar o saldo negativo. Ao editar, apenas a
              diferença é aplicada. O material de um lançamento já salvo não
              pode ser trocado.
            </Text>
          )}
          <Button disabled={busy} onPress={save} style={{ marginTop: 24 }}>
            {busy ? "Salvando..." : "Salvar registro →"}
          </Button>
        </View>
        {picker && (
          <RelationPicker
            field={picker}
            current={values[picker.key]}
            api={api}
            onClose={() => setPicker(null)}
            onSelect={(selected) => {
              set(picker.key, String(selected.id));
              setLabels((l) => ({ ...l, [picker.key]: selected.label }));
              setPicker(null);
            }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
function More({ session, navigate, signOut }) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>GESTÃO / CONFIGURAÇÕES</Text>
      <Text style={styles.title}>Mais opções.</Text>
      {["categorias", "fornecedores"].map((section) => (
        <Pressable
          accessibilityRole="button"
          style={styles.menuCard}
          key={section}
          onPress={() => navigate({ type: "list", section })}
        >
          <Text style={styles.menuIcon}>{sections[section].icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.h2}>{sections[section].title}</Text>
            <Text style={styles.recordSub}>
              {sections[section].description}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ))}
      <View style={[styles.panel, { padding: 22, marginVertical: 22 }]}>
        <Text style={styles.h2}>Conexão atual</Text>
        <Text selectable style={[styles.muted, { marginTop: 10 }]}>
          {session.base}
        </Text>
        <Text style={styles.help}>
          Conectado como {session.user.username}. Os registros são
          compartilhados com o sistema web e o Admin.
        </Text>
      </View>
      <Button
        secondary
        onPress={() =>
          Alert.alert(
            "Sair do EletroStock?",
            "Você poderá entrar novamente ou trocar o endereço do computador.",
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Sair", onPress: signOut },
            ],
          )
        }
      >
        Sair / trocar servidor
      </Button>
    </ScrollView>
  );
}

function Shell() {
  const [session, setSession] = useState(null),
    [boot, setBoot] = useState(true),
    [server, setServer] = useState(""),
    [loginMessage, setLoginMessage] = useState(""),
    [stack, setStack] = useState([{ type: "home" }]),
    [toast, setToast] = useState("");
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [saved, base] = await Promise.all([
          readStored(SESSION_KEY),
          readStored(SERVER_KEY),
        ]);
        if (active) {
          setServer(base || defaultServer());
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.base && parsed.token && parsed.user) setSession(parsed);
          }
        }
      } catch {
      } finally {
        if (active) setBoot(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const expire = useCallback(async () => {
    await deleteStored(SESSION_KEY).catch(() => {});
    setSession(null);
    setStack([{ type: "home" }]);
    setLoginMessage("Sua sessão expirou. Entre novamente.");
  }, []);
  const api = useCallback(
    async (route, options = {}) => {
      if (!session) throw new Error("Entre novamente.");
      try {
        return await request(session.base, route, {
          ...options,
          token: session.token,
        });
      } catch (e) {
        if (e.status === 401) expire();
        throw e;
      }
    },
    [session, expire],
  );
  const navigate = useCallback((screen) => setStack((s) => [...s, screen]), []);
  const back = useCallback(
    () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
    [],
  );
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (stack.length > 1) {
        back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, back]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);
  async function login(value) {
    await writeStored(SESSION_KEY, JSON.stringify(value));
    await writeStored(SERVER_KEY, value.base);
    setServer(value.base);
    setLoginMessage("");
    setSession(value);
    setStack([{ type: "home" }]);
  }
  async function signOut() {
    try {
      await api("auth/logout/", { method: "POST", data: {} });
    } catch {}
    await deleteStored(SESSION_KEY).catch(() => {});
    setSession(null);
    setLoginMessage("");
    setStack([{ type: "home" }]);
  }
  function saved(item) {
    setStack((s) => [
      ...s.slice(0, -1),
      { type: "detail", section: s[s.length - 1].section, id: item.id },
    ]);
    setToast("Registro salvo com sucesso.");
  }
  if (boot) return <Loading />;
  if (!session)
    return (
      <Login
        key={server}
        initialServer={server}
        initialMessage={loginMessage}
        onLogin={login}
      />
    );
  const screen = stack[stack.length - 1];
  const selected =
    screen.type === "home"
      ? "home"
      : ["categorias", "fornecedores"].includes(screen.section)
        ? "more"
        : screen.type === "more"
          ? "more"
          : screen.section;
  return (
    <SafeAreaView style={styles.page} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        {stack.length > 1 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={back}
            style={styles.back}
          >
            <Text style={styles.backText}>←</Text>
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Brand />
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {session.user.username.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      </View>
      {toast ? (
        <View accessibilityRole="alert" style={styles.toast}>
          <Text style={{ color: palette.green, fontWeight: "600" }}>
            {toast}
          </Text>
        </View>
      ) : null}
      <View style={styles.screen}>
        {screen.type === "home" ? (
          <Home key={stack.length} api={api} navigate={navigate} />
        ) : screen.type === "list" ? (
          <ListScreen
            key={screen.section + String(screen.low)}
            section={screen.section}
            low={screen.low}
            api={api}
            navigate={navigate}
          />
        ) : screen.type === "detail" ? (
          <DetailScreen
            key={screen.section + screen.id + stack.length}
            section={screen.section}
            id={screen.id}
            api={api}
            navigate={navigate}
          />
        ) : screen.type === "form" ? (
          <FormScreen
            key={screen.section + String(screen.id || "new")}
            {...screen}
            api={api}
            onSaved={saved}
          />
        ) : (
          <More session={session} navigate={navigate} signOut={signOut} />
        )}
      </View>
      <SafeAreaView edges={["bottom"]} style={styles.tabSafe}>
        <View style={styles.tabs}>
          {[
            ["home", "◫", "Início"],
            ["materiais", "▦", "Materiais"],
            ["movimentacoes", "⇄", "Movimentos"],
            ["more", "•••", "Mais"],
          ].map(([key, icon, label]) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: selected === key }}
              key={key}
              onPress={() =>
                setStack([
                  {
                    type:
                      key === "home"
                        ? "home"
                        : key === "more"
                          ? "more"
                          : "list",
                    ...(sections[key] ? { section: key } : {}),
                  },
                ])
              }
              style={styles.tab}
            >
              <Text
                style={[
                  styles.tabIcon,
                  selected === key && { color: palette.green },
                ]}
              >
                {icon}
              </Text>
              <Text
                style={[
                  styles.tabLabel,
                  selected === key && {
                    color: palette.green,
                    fontWeight: "700",
                  },
                ]}
              >
                {label}
              </Text>
              {selected === key && <View style={styles.tabIndicator} />}
            </Pressable>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Shell />
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.paper },
  green: { color: palette.green },
  header: {
    height: 76,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    gap: 10,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  bolt: {
    backgroundColor: palette.lime,
    color: palette.ink,
    fontSize: 27,
    fontWeight: "800",
    paddingHorizontal: 11,
    borderRadius: 9,
    overflow: "hidden",
  },
  brand: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.7,
    color: palette.ink,
  },
  avatar: {
    backgroundColor: "#e9efdf",
    borderRadius: 22,
    width: 37,
    height: 37,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "800", color: palette.green, fontSize: 12 },
  back: { padding: 5 },
  backText: { fontSize: 27, color: palette.green },
  screen: { flex: 1 },
  content: {
    padding: 22,
    paddingBottom: 36,
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
  },
  eyebrow: {
    color: palette.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.7,
    marginTop: 8,
    marginBottom: 9,
  },
  title: {
    color: palette.ink,
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: 7,
    flexShrink: 1,
  },
  h2: { fontSize: 17, fontWeight: "700", color: palette.ink },
  muted: { fontSize: 14, color: palette.muted, lineHeight: 21 },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 23,
    marginBottom: 20,
  },
  stat: {
    borderRadius: 13,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: palette.line,
    padding: 17,
    minHeight: 136,
    justifyContent: "space-between",
  },
  statWarn: { backgroundColor: "#fff5e2", borderColor: "#efddb9" },
  statLabel: { fontSize: 12, color: palette.muted, lineHeight: 18 },
  statValue: {
    fontSize: 31,
    fontWeight: "800",
    letterSpacing: -1,
    color: palette.ink,
    marginVertical: 10,
  },
  statHint: { fontSize: 10, color: palette.muted, lineHeight: 15 },
  button: {
    backgroundColor: palette.green,
    borderRadius: 9,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 47,
  },
  buttonText: { fontSize: 14, fontWeight: "700", color: "white" },
  secondary: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: palette.line,
  },
  panel: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.line,
    overflow: "hidden",
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 27,
    marginBottom: 15,
  },
  link: { fontSize: 12, fontWeight: "600", color: palette.green },
  record: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 17,
    borderBottomWidth: 1,
    borderBottomColor: "#eff3ee",
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.ink,
    lineHeight: 21,
  },
  recordSub: {
    fontSize: 11,
    color: palette.muted,
    marginTop: 4,
    lineHeight: 17,
  },
  recordRight: { alignItems: "flex-end", maxWidth: "45%" },
  badge: {
    backgroundColor: "#e9f4ea",
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  badgeWarn: { backgroundColor: "#fff0d4" },
  badgeText: { fontSize: 11, fontWeight: "600", color: palette.green },
  lowText: { fontSize: 10, color: palette.warning, marginTop: 5 },
  chevron: { fontSize: 22, color: palette.muted },
  empty: { padding: 30, alignItems: "center", gap: 10 },
  emptyIcon: { fontSize: 30, color: "#9db29e" },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 140,
  },
  listHeader: {
    padding: 22,
    paddingBottom: 8,
    maxWidth: 1000,
    width: "100%",
    alignSelf: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 13,
  },
  search: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 9,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 14,
    marginTop: 8,
    color: palette.ink,
  },
  filter: { alignSelf: "flex-start", paddingVertical: 14 },
  filterText: { fontSize: 12, color: palette.muted, fontWeight: "600" },
  help: { fontSize: 11, color: palette.muted, lineHeight: 18, marginTop: 9 },
  listBody: {
    paddingHorizontal: 22,
    paddingBottom: 25,
    maxWidth: 1000,
    width: "100%",
    alignSelf: "center",
  },
  listCard: {
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: palette.line,
    marginTop: 10,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 20,
  },
  balance: {
    backgroundColor: "#eaf2df",
    borderWidth: 1,
    borderColor: "#dce9d0",
    borderRadius: 12,
    padding: 23,
    marginTop: 16,
    alignItems: "flex-start",
  },
  detailField: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f3ee",
  },
  detailValue: {
    fontSize: 14,
    color: palette.ink,
    lineHeight: 22,
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.ink,
    marginBottom: 9,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d7e1d9",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    color: palette.ink,
    minHeight: 46,
  },
  textarea: { minHeight: 110 },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  disabled: { backgroundColor: "#f0f3ee" },
  formField: { marginBottom: 8 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "white",
  },
  choiceSelected: {
    backgroundColor: palette.green,
    borderColor: palette.green,
  },
  choiceText: { color: palette.ink, fontSize: 13 },
  fieldError: {
    color: palette.red,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: "#fff0ed",
    padding: 14,
    borderRadius: 8,
    marginTop: 15,
    marginBottom: 6,
  },
  errorText: { fontSize: 12, color: palette.red, lineHeight: 19 },
  pickRow: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    padding: 22,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    marginTop: 15,
  },
  menuIcon: { fontSize: 26, color: palette.green },
  tabs: {
    flexDirection: "row",
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: palette.line,
    height: 69,
    paddingHorizontal: 12,
  },
  tabSafe: { backgroundColor: "white" },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4 },
  tabIcon: { fontSize: 23, color: "#96a49b", fontWeight: "700" },
  tabLabel: { fontSize: 10, color: palette.muted },
  tabIndicator: {
    position: "absolute",
    top: 0,
    height: 3,
    width: 28,
    borderRadius: 2,
    backgroundColor: palette.green,
  },
  toast: { padding: 13, backgroundColor: "#e9f6de", alignItems: "center" },
  loginBg: { flex: 1, backgroundColor: "#102f2b" },
  loginWrap: { flexGrow: 1, justifyContent: "center", padding: 24 },
  loginCard: {
    backgroundColor: "white",
    padding: 26,
    borderRadius: 18,
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
  },
  loginTitle: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1.2,
    color: palette.ink,
    lineHeight: 41,
    marginTop: 17,
    marginBottom: 10,
  },
  loginFoot: {
    fontSize: 10,
    color: palette.muted,
    textAlign: "center",
    marginTop: 22,
  },
});
