import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";

function normalize(value: unknown): unknown {
  if (typeof value === "bigint") {
    const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
    const minSafe = BigInt(Number.MIN_SAFE_INTEGER);
    if (value <= maxSafe && value >= minSafe) {
      return Number(value);
    }
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalize(item));
  }

  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalize(item)])
    );
  }

  return value;
}

@Injectable()
export class BigIntSerializerInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => normalize(data)));
  }
}
