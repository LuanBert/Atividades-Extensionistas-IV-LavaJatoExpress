# Guia de Integração Mobile - Lavajato Express API

Este documento fornece instruções específicas para integração da API do Lavajato Express com aplicativos mobile desenvolvidos em React Native, Flutter ou outras plataformas.

## Visão Geral

A API do Lavajato Express foi projetada para ser facilmente integrada com aplicativos mobile através do protocolo tRPC, que oferece type-safety completo e validação automática de dados. O público-alvo do aplicativo mobile inclui indivíduos que não têm disponibilidade para realizar a lavagem do carro em casa e preferem agendar o serviço de forma rápida e conveniente.

## URL Base da API

```
https://your-api-domain.com/api/trpc
```

Substitua `your-api-domain.com` pelo domínio onde a API está hospedada.

## Integração React Native

### Instalação de Dependências

```bash
npm install @trpc/client @trpc/react-query @tanstack/react-query superjson
```

### Configuração do Cliente tRPC

Crie um arquivo `src/lib/trpc.ts`:

```typescript
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/routers';

export const trpc = createTRPCReact<AppRouter>();
```

### Configuração do Provider

No arquivo principal do app (`App.tsx`):

```typescript
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './lib/trpc';
import superjson from 'superjson';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
    },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'https://your-api-domain.com/api/trpc',
      transformer: superjson,
      headers: async () => {
        // Adicione headers customizados se necessário
        return {};
      },
    }),
  ],
});

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {/* Seus componentes aqui */}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### Exemplos de Uso

#### Listar Veículos

```typescript
import { trpc } from '../lib/trpc';
import { View, Text, FlatList } from 'react-native';

export function VehiclesScreen() {
  const { data: vehicles, isLoading } = trpc.vehicles.list.useQuery();

  if (isLoading) {
    return <Text>Carregando...</Text>;
  }

  return (
    <FlatList
      data={vehicles}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View>
          <Text>{item.brand} {item.model}</Text>
          <Text>{item.plate}</Text>
        </View>
      )}
    />
  );
}
```

#### Criar Agendamento

```typescript
import { trpc } from '../lib/trpc';
import { Button, Alert } from 'react-native';

export function BookingScreen() {
  const utils = trpc.useUtils();
  const createAppointment = trpc.appointments.create.useMutation({
    onSuccess: () => {
      utils.appointments.list.invalidate();
      Alert.alert('Sucesso', 'Agendamento criado!');
    },
    onError: (error) => {
      Alert.alert('Erro', error.message);
    },
  });

  const handleBooking = () => {
    createAppointment.mutate({
      vehicleId: 1,
      serviceType: 'complete',
      appointmentDate: new Date('2025-12-15T10:00:00'),
    });
  };

  return (
    <Button
      title="Agendar Lavagem"
      onPress={handleBooking}
      disabled={createAppointment.isPending}
    />
  );
}
```

#### Buscar Clima Atual

```typescript
import { trpc } from '../lib/trpc';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export function WeatherWidget() {
  const [location, setLocation] = useState<{latitude: number, longitude: number} | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    })();
  }, []);

  const { data: weather } = trpc.weather.getCurrent.useQuery(
    { latitude: location?.latitude || 0, longitude: location?.longitude || 0 },
    { enabled: !!location }
  );

  if (!weather) return null;

  return (
    <View>
      <Text>Temperatura: {Math.round(weather.current.temperature_2m)}°C</Text>
      <Text>Umidade: {weather.current.relative_humidity_2m}%</Text>
    </View>
  );
}
```

## Integração Flutter

### Instalação de Dependências

Adicione ao `pubspec.yaml`:

```yaml
dependencies:
  http: ^1.1.0
  json_annotation: ^4.8.1
```

### Cliente HTTP Básico

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class LavajatoApiClient {
  final String baseUrl = 'https://your-api-domain.com/api/trpc';
  
  Future<List<Vehicle>> getVehicles() async {
    final response = await http.get(
      Uri.parse('$baseUrl/vehicles.list'),
      headers: {'Content-Type': 'application/json'},
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['result']['data'] as List)
          .map((v) => Vehicle.fromJson(v))
          .toList();
    } else {
      throw Exception('Failed to load vehicles');
    }
  }
  
  Future<Appointment> createAppointment({
    required int vehicleId,
    required String serviceType,
    required DateTime appointmentDate,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/appointments.create'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'vehicleId': vehicleId,
        'serviceType': serviceType,
        'appointmentDate': appointmentDate.toIso8601String(),
      }),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return Appointment.fromJson(data['result']['data']);
    } else {
      throw Exception('Failed to create appointment');
    }
  }
}
```

### Modelos de Dados

```dart
class Vehicle {
  final int id;
  final String brand;
  final String model;
  final String plate;
  final String? color;
  final int? year;

  Vehicle({
    required this.id,
    required this.brand,
    required this.model,
    required this.plate,
    this.color,
    this.year,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id'],
      brand: json['brand'],
      model: json['model'],
      plate: json['plate'],
      color: json['color'],
      year: json['year'],
    );
  }
}

class Appointment {
  final int id;
  final int vehicleId;
  final String serviceType;
  final DateTime appointmentDate;
  final String status;

  Appointment({
    required this.id,
    required this.vehicleId,
    required this.serviceType,
    required this.appointmentDate,
    required this.status,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'],
      vehicleId: json['vehicleId'],
      serviceType: json['serviceType'],
      appointmentDate: DateTime.parse(json['appointmentDate']),
      status: json['status'],
    );
  }
}
```

## Gerenciamento de Autenticação

### Fluxo de Autenticação OAuth

O sistema utiliza OAuth do Manus para autenticação. O fluxo recomendado para mobile é:

1. **Abrir WebView** com a URL de login:
   ```
   https://portal.manus.im/oauth/authorize?app_id=YOUR_APP_ID&redirect_uri=YOUR_REDIRECT
   ```

2. **Capturar Callback** quando o usuário completar o login

3. **Armazenar Token** de forma segura usando:
   - React Native: `@react-native-async-storage/async-storage` ou `expo-secure-store`
   - Flutter: `flutter_secure_storage`

4. **Incluir Token** em todas as requisições subsequentes

### Exemplo React Native com Secure Storage

```typescript
import * as SecureStore from 'expo-secure-store';

async function saveToken(token: string) {
  await SecureStore.setItemAsync('auth_token', token);
}

async function getToken() {
  return await SecureStore.getItemAsync('auth_token');
}

// Configurar cliente tRPC com token
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'https://your-api-domain.com/api/trpc',
      headers: async () => {
        const token = await getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
```

## Tratamento de Erros

### Códigos de Erro Comuns

```typescript
try {
  await createAppointment.mutateAsync({...});
} catch (error) {
  if (error.data?.code === 'UNAUTHORIZED') {
    // Redirecionar para login
  } else if (error.data?.code === 'NOT_FOUND') {
    // Recurso não encontrado
  } else if (error.data?.code === 'FORBIDDEN') {
    // Acesso negado
  } else {
    // Erro genérico
    Alert.alert('Erro', error.message);
  }
}
```

## Otimizações para Mobile

### Cache de Dados

Configure cache apropriado para reduzir uso de dados:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

### Atualizações Otimistas

Para melhor UX, use atualizações otimistas:

```typescript
const deleteMutation = trpc.vehicles.delete.useMutation({
  onMutate: async (deletedId) => {
    await utils.vehicles.list.cancel();
    const previousVehicles = utils.vehicles.list.getData();
    
    utils.vehicles.list.setData(undefined, (old) =>
      old?.filter((v) => v.id !== deletedId)
    );
    
    return { previousVehicles };
  },
  onError: (err, deletedId, context) => {
    utils.vehicles.list.setData(undefined, context?.previousVehicles);
  },
  onSettled: () => {
    utils.vehicles.list.invalidate();
  },
});
```

### Prefetch de Dados

Carregue dados antecipadamente para melhor performance:

```typescript
// Ao entrar na tela de agendamento, prefetch veículos
useEffect(() => {
  utils.vehicles.list.prefetch();
}, []);
```

## Notificações Push

Para implementar notificações push quando novos agendamentos forem confirmados:

### React Native (Expo)

```bash
npx expo install expo-notifications
```

```typescript
import * as Notifications from 'expo-notifications';

// Configurar handler de notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Registrar para notificações
async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    return;
  }
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  // Enviar token para o backend
}
```

## Geolocalização

Para buscar clima baseado na localização do usuário:

### React Native (Expo)

```bash
npx expo install expo-location
```

```typescript
import * as Location from 'expo-location';

async function getCurrentLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }
  
  const location = await Location.getCurrentPositionAsync({});
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}
```

## Boas Práticas

### 1. Validação de Dados

Sempre valide dados antes de enviar para a API:

```typescript
import { z } from 'zod';

const vehicleSchema = z.object({
  brand: z.string().min(1, 'Marca é obrigatória'),
  model: z.string().min(1, 'Modelo é obrigatório'),
  plate: z.string().min(7, 'Placa inválida'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
});

// Validar antes de enviar
try {
  const validData = vehicleSchema.parse(formData);
  await createVehicle.mutateAsync(validData);
} catch (error) {
  // Mostrar erros de validação
}
```

### 2. Loading States

Sempre mostre feedback visual durante operações:

```typescript
{createAppointment.isPending && <ActivityIndicator />}
{createAppointment.isError && <Text>Erro: {createAppointment.error.message}</Text>}
{createAppointment.isSuccess && <Text>Agendamento criado!</Text>}
```

### 3. Offline Support

Implemente suporte offline básico:

```typescript
import NetInfo from '@react-native-community/netinfo';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

// Verificar conectividade
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    queryClient.refetchQueries();
  }
});
```

### 4. Tratamento de Datas

Sempre use UTC para enviar datas e converta para timezone local na exibição:

```typescript
// Enviar para API
const appointmentDate = new Date('2025-12-15T10:00:00');

// Exibir para usuário
const displayDate = appointmentDate.toLocaleString('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  dateStyle: 'short',
  timeStyle: 'short',
});
```

## Testando a Integração

### Ferramentas Recomendadas

- **Postman**: Para testar endpoints manualmente
- **React Native Debugger**: Para debug de requisições
- **Flipper**: Para inspeção de rede no React Native

### Exemplo de Teste com Jest

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { trpc } from '../lib/trpc';

describe('Vehicles API', () => {
  it('should fetch vehicles', async () => {
    const { result } = renderHook(() => trpc.vehicles.list.useQuery());
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});
```

## Troubleshooting

### Problema: Erro de CORS

**Solução**: Configure o backend para aceitar requisições do domínio mobile ou use proxy.

### Problema: Timeout em Requisições

**Solução**: Aumente o timeout no cliente HTTP:

```typescript
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'https://your-api-domain.com/api/trpc',
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(30000), // 30 segundos
        });
      },
    }),
  ],
});
```

### Problema: Dados não Atualizando

**Solução**: Force refetch ou invalide cache:

```typescript
utils.vehicles.list.invalidate();
// ou
utils.vehicles.list.refetch();
```

## Recursos Adicionais

- [Documentação tRPC](https://trpc.io)
- [React Query Docs](https://tanstack.com/query/latest)
- [Expo Documentation](https://docs.expo.dev)
- [Flutter HTTP Package](https://pub.dev/packages/http)

---

**Suporte**: Para dúvidas sobre integração mobile, abra uma issue no repositório do projeto.
