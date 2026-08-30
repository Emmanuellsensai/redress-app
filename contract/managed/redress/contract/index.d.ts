import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  register_platform(context: __compactRuntime.CircuitContext<PS>,
                    new_public_key_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submit_claim(context: __compactRuntime.CircuitContext<PS>,
               encrypted_evidence_0: Uint8Array,
               evidence_plaintext_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  post_verdict(context: __compactRuntime.CircuitContext<PS>,
               verdict_text_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  register_platform(context: __compactRuntime.CircuitContext<PS>,
                    new_public_key_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submit_claim(context: __compactRuntime.CircuitContext<PS>,
               encrypted_evidence_0: Uint8Array,
               evidence_plaintext_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  post_verdict(context: __compactRuntime.CircuitContext<PS>,
               verdict_text_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  register_platform(context: __compactRuntime.CircuitContext<PS>,
                    new_public_key_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submit_claim(context: __compactRuntime.CircuitContext<PS>,
               encrypted_evidence_0: Uint8Array,
               evidence_plaintext_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  post_verdict(context: __compactRuntime.CircuitContext<PS>,
               verdict_text_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly claim_count: bigint;
  readonly platform_public_key: Uint8Array;
  readonly platform_key_version: bigint;
  evidence_inbox: {
    isEmpty(): boolean;
    length(): bigint;
    head(): { is_some: boolean, value: Uint8Array };
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  readonly latest_evidence_hash: Uint8Array;
  readonly latest_verdict_hash: Uint8Array;
  readonly verdict_count: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
