'use client';

import React, { useMemo, useState } from 'react';
import {
  IoAdd,
  IoCreateOutline,
} from 'react-icons/io5';
import {
  createAccountAction,
  createBudgetGroupAction,
  createCategoryAction,
  createSavingsFundAction,
  deleteAccountAction,
  deleteBudgetGroupAction,
  deleteCategoryAction,
  deleteSavingsFundAction,
  updateAccountAction,
  updateBudgetGroupAction,
  updateCategoryAction,
  updatePreferencesAction,
  updateSavingsFundAction,
} from '@/actions';
import {
  ACCOUNT_TYPE_LABELS,
  FLOW_TYPE_LABELS,
  SETTINGS_TABS,
} from '@/lib/constants';
import { formatTk } from '@/lib/format';
import { useActionToast } from '@/hooks/useActionToast';
import { PageShell } from '@/components/layout/PageShell';
import { SubpageHeader } from '@/components/layout/SubpageHeader';
import { Button, IconButton } from '@/components/ui/Button';
import {
  ConfirmDeleteButton,
  ROW_ACTIONS_CLASS,
} from '@/components/ui/ConfirmDeleteButton';
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox';
import { Field, fieldClass, MoneyInput, SearchField } from '@/components/ui/Field';
import { EmptyState, Section } from '@/components/ui/Section';
import { Sheet } from '@/components/ui/Sheet';
import type {
  AccountSettingRow,
  AccountType,
  BudgetGroupSettingRow,
  CategorySettingRow,
  FlowType,
  SavingsFundSettingRow,
  SettingsSnapshot,
  SettingsTab,
} from '@/types/ledger';
import { CategoryForm } from './CategoryForm';

type SheetState =
  | { kind: 'category'; item: CategorySettingRow | null }
  | { kind: 'budgetGroup'; item: BudgetGroupSettingRow | null }
  | { kind: 'savingsFund'; item: SavingsFundSettingRow | null }
  | { kind: 'account'; item: AccountSettingRow | null }
  | null;

const ACCOUNT_TYPE_OPTIONS: ComboboxOption[] = (
  Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]
).map((t) => ({
  value: t,
  label: ACCOUNT_TYPE_LABELS[t],
}));

const FLOW_FILTER_OPTIONS: ComboboxOption[] = [
  { value: 'ALL', label: 'All types' },
  ...(Object.keys(FLOW_TYPE_LABELS) as FlowType[]).map((ft) => ({
    value: ft,
    label: FLOW_TYPE_LABELS[ft],
  })),
];

function SettingsRowActions({
  inUseText,
  editLabel,
  deleteLabel,
  confirmDeleteLabel,
  disabled,
  onEdit,
  onDelete,
}: {
  inUseText?: string;
  editLabel: string;
  deleteLabel: string;
  confirmDeleteLabel: string;
  disabled: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {inUseText && (
        <span className="text-xs tabular-nums text-neutral-400">{inUseText}</span>
      )}
      <div className={ROW_ACTIONS_CLASS}>
        <IconButton label={editLabel} disabled={disabled} onClick={onEdit}>
          <IoCreateOutline />
        </IconButton>
        {onDelete && (
          <ConfirmDeleteButton
            label={deleteLabel}
            confirmLabel={confirmDeleteLabel}
            disabled={disabled}
            onConfirm={onDelete}
          />
        )}
      </div>
    </div>
  );
}

/** Focused settings workspace organized into Preferences, Categories, Accounts, and Budgets & funds tabs. */
export function SettingsView({
  data,
  initialTab = 'preferences',
}: {
  data: SettingsSnapshot;
  initialTab?: SettingsTab;
}) {
  const { isPending, toast, dismissToast, runAction: runMutation } = useActionToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [accountType, setAccountType] = useState<AccountType | ''>('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [categoryFlow, setCategoryFlow] = useState<FlowType | 'ALL'>('ALL');
  const [groupQuery, setGroupQuery] = useState('');
  const [fundQuery, setFundQuery] = useState('');
  const [accountQuery, setAccountQuery] = useState('');

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    return data.categories.filter((cat) => {
      if (categoryFlow !== 'ALL' && cat.flowType !== categoryFlow) return false;
      if (!q) return true;
      return [
        cat.name,
        FLOW_TYPE_LABELS[cat.flowType],
        cat.budgetGroupName,
        cat.defaultSavingsFundName,
      ].some((text) => text?.toLowerCase().includes(q));
    });
  }, [data.categories, categoryQuery, categoryFlow]);

  const filteredGroups = useMemo(() => {
    const q = groupQuery.trim().toLowerCase();
    if (!q) return data.budgetGroups;
    return data.budgetGroups.filter((bg) => bg.name.toLowerCase().includes(q));
  }, [data.budgetGroups, groupQuery]);

  const filteredFunds = useMemo(() => {
    const q = fundQuery.trim().toLowerCase();
    if (!q) return data.savingsFunds;
    return data.savingsFunds.filter((sf) => sf.name.toLowerCase().includes(q));
  }, [data.savingsFunds, fundQuery]);

  const filteredAccounts = useMemo(() => {
    const q = accountQuery.trim().toLowerCase();
    if (!q) return data.accounts;
    return data.accounts.filter((acc) =>
      [acc.name, ACCOUNT_TYPE_LABELS[acc.type]].some((text) =>
        text.toLowerCase().includes(q)
      )
    );
  }, [data.accounts, accountQuery]);

  const sheetTitle = (() => {
    if (!sheet) return '';
    switch (sheet.kind) {
      case 'category':
        return sheet.item ? 'Edit category' : 'New category';
      case 'budgetGroup':
        return sheet.item ? 'Edit budget group' : 'New budget group';
      case 'savingsFund':
        return sheet.item ? 'Edit savings fund' : 'New savings fund';
      case 'account':
        return sheet.item ? 'Edit account' : 'New account';
    }
  })();

  return (
    <PageShell
      header={<SubpageHeader userName={data.user.name} userEmail={data.user.email} />}
      title="Settings"
      toast={toast}
      onDismissToast={dismissToast}
    >
      <div className="space-y-8 sm:space-y-10">
        <div
          role="tablist"
          aria-label="Settings sections"
          className="flex gap-4 overflow-x-auto border-b border-neutral-200 [scrollbar-width:none] sm:gap-7 [&::-webkit-scrollbar]:hidden"
        >
          {SETTINGS_TABS.map((tab, index) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`settings-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`settings-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                  e.preventDefault();
                  const delta = e.key === 'ArrowRight' ? 1 : -1;
                  const next =
                    SETTINGS_TABS[
                      (index + delta + SETTINGS_TABS.length) % SETTINGS_TABS.length
                    ];
                  setActiveTab(next.id);
                  document.getElementById(`settings-tab-${next.id}`)?.focus();
                }}
                className={`shrink-0 whitespace-nowrap border-b-[1.5px] pb-2.5 text-[14px] transition-colors sm:pb-3 sm:text-[15px] ${
                  selected
                    ? 'border-black text-black'
                    : 'border-transparent text-neutral-400 hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`settings-panel-${activeTab}`}
          aria-labelledby={`settings-tab-${activeTab}`}
        >
          {activeTab === 'preferences' && (
            <form
              key={`${data.user.currencyCode}-${data.user.currencySymbol}-${data.user.openingCashBalance}-${data.user.openingSavingsBalance}`}
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                runMutation(
                  () => updatePreferencesAction(fd),
                  'Preferences saved'
                );
              }}
            >
              <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
                <Section title="Currency">
                  <div className="grid grid-cols-2 gap-6">
                    <Field label="Currency code">
                      <input
                        type="text"
                        name="currencyCode"
                        required
                        minLength={3}
                        maxLength={3}
                        defaultValue={data.user.currencyCode}
                        className={`${fieldClass} uppercase`}
                      />
                    </Field>
                    <Field label="Currency symbol">
                      <input
                        type="text"
                        name="currencySymbol"
                        required
                        defaultValue={data.user.currencySymbol}
                        className={fieldClass}
                      />
                    </Field>
                  </div>
                </Section>

                <Section title="Opening balances">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Field label="Opening cash balance">
                      <MoneyInput
                        symbol={data.user.currencySymbol}
                        name="openingCashBalance"
                        step="0.01"
                        required
                        defaultValue={data.user.openingCashBalance}
                        className="text-[17px]"
                      />
                    </Field>
                    <Field label="Opening savings balance">
                      <MoneyInput
                        symbol={data.user.currencySymbol}
                        name="openingSavingsBalance"
                        step="0.01"
                        required
                        defaultValue={data.user.openingSavingsBalance}
                        className="text-[17px]"
                      />
                    </Field>
                  </div>
                </Section>
              </div>

              <div className="mt-8 flex justify-end border-t border-neutral-200 pt-5 sm:mt-10">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full shrink-0 sm:w-auto"
                >
                  Save preferences
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'categories' && (
            <Section
              title="Categories"
              action={
                <Button
                  variant="ghost"
                  onClick={() => setSheet({ kind: 'category', item: null })}
                >
                  <IoAdd className="text-base" />
                  Add category
                </Button>
              }
            >
              {data.categories.length > 0 && (
                <div className="mb-4 flex flex-col gap-2 border-b border-neutral-100 pb-3 sm:flex-row sm:items-center sm:gap-8">
                  <SearchField
                    value={categoryQuery}
                    onChange={setCategoryQuery}
                    label="Search categories"
                    placeholder="Search categories"
                  />
                  <Combobox
                    ariaLabel="Filter categories by type"
                    options={FLOW_FILTER_OPTIONS}
                    value={categoryFlow}
                    onChange={(val) =>
                      setCategoryFlow((val || 'ALL') as FlowType | 'ALL')
                    }
                    allowClear={categoryFlow !== 'ALL'}
                    placeholder="All types"
                    className="w-full sm:w-44"
                    inputClassName="border-b-0 py-1.5 text-[15px] text-neutral-600"
                  />
                </div>
              )}

              {data.categories.length === 0 ? (
                <EmptyState>No categories yet</EmptyState>
              ) : filteredCategories.length === 0 ? (
                <EmptyState>No matching categories</EmptyState>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 md:gap-x-12">
                  {filteredCategories.map((cat) => {
                    const inUse = cat.usageCount > 0;
                    const meta = [
                      FLOW_TYPE_LABELS[cat.flowType],
                      cat.budgetGroupName,
                      cat.defaultSavingsFundName,
                    ]
                      .filter(Boolean)
                      .join(' · ');

                    return (
                      <li
                        key={cat.id}
                        className="group flex items-center justify-between gap-3 border-b border-neutral-100 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[16px] sm:text-[17px]">{cat.name}</p>
                          <p className="truncate text-xs text-neutral-500 sm:text-sm">
                            {meta}
                          </p>
                        </div>
                        <SettingsRowActions
                          inUseText={inUse ? `In use (${cat.usageCount})` : undefined}
                          editLabel="Edit category"
                          deleteLabel="Delete category"
                          confirmDeleteLabel="Confirm delete category"
                          disabled={isPending}
                          onEdit={() => setSheet({ kind: 'category', item: cat })}
                          onDelete={
                            inUse
                              ? undefined
                              : () =>
                                  runMutation(
                                    () => deleteCategoryAction(cat.id),
                                    'Category deleted'
                                  )
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
          )}

          {activeTab === 'planning' && (
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <Section
                title="Budget groups"
                action={
                  <Button
                    variant="ghost"
                    onClick={() => setSheet({ kind: 'budgetGroup', item: null })}
                  >
                    <IoAdd className="text-base" />
                    Add
                  </Button>
                }
              >
                {data.budgetGroups.length > 0 && (
                  <div className="mb-3 border-b border-neutral-100 pb-2">
                    <SearchField
                      value={groupQuery}
                      onChange={setGroupQuery}
                      label="Search budget groups"
                      placeholder="Search budget groups"
                    />
                  </div>
                )}

                {data.budgetGroups.length === 0 ? (
                  <EmptyState>No budget groups yet</EmptyState>
                ) : filteredGroups.length === 0 ? (
                  <EmptyState>No matching budget groups</EmptyState>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {filteredGroups.map((bg) => {
                      const inUse = bg.usageCount > 0;
                      return (
                        <li
                          key={bg.id}
                          className="group flex items-center justify-between gap-3 py-3"
                        >
                          <span className="truncate text-[16px] sm:text-[17px]">
                            {bg.name}
                          </span>
                          <SettingsRowActions
                            inUseText={inUse ? 'In use' : undefined}
                            editLabel="Edit budget group"
                            deleteLabel="Delete budget group"
                            confirmDeleteLabel="Confirm delete budget group"
                            disabled={isPending}
                            onEdit={() => setSheet({ kind: 'budgetGroup', item: bg })}
                            onDelete={
                              inUse
                                ? undefined
                                : () =>
                                    runMutation(
                                      () => deleteBudgetGroupAction(bg.id),
                                      'Budget group deleted'
                                    )
                            }
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Section>

              <Section
                title="Savings funds"
                action={
                  <Button
                    variant="ghost"
                    onClick={() => setSheet({ kind: 'savingsFund', item: null })}
                  >
                    <IoAdd className="text-base" />
                    Add
                  </Button>
                }
              >
                {data.savingsFunds.length > 0 && (
                  <div className="mb-3 border-b border-neutral-100 pb-2">
                    <SearchField
                      value={fundQuery}
                      onChange={setFundQuery}
                      label="Search savings funds"
                      placeholder="Search savings funds"
                    />
                  </div>
                )}

                {data.savingsFunds.length === 0 ? (
                  <EmptyState>No savings funds yet</EmptyState>
                ) : filteredFunds.length === 0 ? (
                  <EmptyState>No matching savings funds</EmptyState>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {filteredFunds.map((sf) => {
                      const inUse = sf.usageCount > 0;
                      return (
                        <li
                          key={sf.id}
                          className="group flex items-center justify-between gap-3 py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[16px] sm:text-[17px]">
                              {sf.name}
                            </p>
                            {sf.openingBalance !== 0 && (
                              <p className="text-xs tabular-nums text-neutral-500 sm:text-sm">
                                {formatTk(sf.openingBalance, {
                                  symbol: data.user.currencySymbol,
                                })}
                              </p>
                            )}
                          </div>
                          <SettingsRowActions
                            inUseText={inUse ? 'In use' : undefined}
                            editLabel="Edit savings fund"
                            deleteLabel="Delete savings fund"
                            confirmDeleteLabel="Confirm delete savings fund"
                            disabled={isPending}
                            onEdit={() => setSheet({ kind: 'savingsFund', item: sf })}
                            onDelete={
                              inUse
                                ? undefined
                                : () =>
                                    runMutation(
                                      () => deleteSavingsFundAction(sf.id),
                                      'Savings fund deleted'
                                    )
                            }
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Section>
            </div>
          )}

          {activeTab === 'accounts' && (
            <Section
              title="Accounts"
              action={
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAccountType('');
                    setSheet({ kind: 'account', item: null });
                  }}
                >
                  <IoAdd className="text-base" />
                  Add
                </Button>
              }
            >
              {data.accounts.length > 0 && (
                <div className="mb-4 border-b border-neutral-100 pb-3">
                  <SearchField
                    value={accountQuery}
                    onChange={setAccountQuery}
                    label="Search accounts"
                    placeholder="Search accounts"
                  />
                </div>
              )}

              {data.accounts.length === 0 ? (
                <EmptyState>No accounts yet</EmptyState>
              ) : filteredAccounts.length === 0 ? (
                <EmptyState>No matching accounts</EmptyState>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 md:gap-x-12">
                  {filteredAccounts.map((acc) => {
                    const inUse = acc.usageCount > 0;
                    return (
                      <li
                        key={acc.id}
                        className="group flex items-center justify-between gap-3 border-b border-neutral-100 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[16px] sm:text-[17px]">{acc.name}</p>
                          <p className="text-xs tabular-nums text-neutral-500 sm:text-sm">
                            {ACCOUNT_TYPE_LABELS[acc.type]}
                            {acc.openingBalance !== 0
                              ? ` · ${formatTk(acc.openingBalance, {
                                  symbol: data.user.currencySymbol,
                                })}`
                              : ''}
                          </p>
                        </div>
                        <SettingsRowActions
                          inUseText={inUse ? 'In use' : undefined}
                          editLabel="Edit account"
                          deleteLabel="Delete account"
                          confirmDeleteLabel="Confirm delete account"
                          disabled={isPending}
                          onEdit={() => {
                            setAccountType(acc.type);
                            setSheet({ kind: 'account', item: acc });
                          }}
                          onDelete={
                            inUse
                              ? undefined
                              : () =>
                                  runMutation(
                                    () => deleteAccountAction(acc.id),
                                    'Account deleted'
                                  )
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
          )}
        </div>
      </div>

      <Sheet
        title={sheetTitle}
        open={sheet !== null}
        onClose={() => setSheet(null)}
      >
        {sheet?.kind === 'category' && (
          <CategoryForm
            key={sheet.item?.id ?? 'new-category'}
            budgetGroups={data.budgetGroups}
            savingsFunds={data.savingsFunds}
            initialCategory={sheet.item}
            isPending={isPending}
            onSubmit={(fd) =>
              runMutation(
                () =>
                  sheet.item
                    ? updateCategoryAction(fd)
                    : createCategoryAction(fd),
                sheet.item ? 'Category updated' : 'Category added',
                () => setSheet(null)
              )
            }
          />
        )}

        {sheet?.kind === 'budgetGroup' && (
          <form
            key={sheet.item?.id ?? 'new-bg'}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              runMutation(
                () =>
                  sheet.item
                    ? updateBudgetGroupAction(fd)
                    : createBudgetGroupAction(fd),
                sheet.item ? 'Budget group updated' : 'Budget group added',
                () => setSheet(null)
              );
            }}
            className="space-y-7"
          >
            {sheet.item && (
              <input type="hidden" name="id" value={sheet.item.id} />
            )}
            <Field label="Name">
              <input
                type="text"
                name="name"
                required
                autoFocus
                defaultValue={sheet.item?.name ?? ''}
                placeholder="e.g. Essentials"
                className={fieldClass}
              />
            </Field>
            <Button type="submit" disabled={isPending} className="w-full">
              {sheet.item ? 'Save changes' : 'Add budget group'}
            </Button>
          </form>
        )}

        {sheet?.kind === 'savingsFund' && (
          <form
            key={sheet.item?.id ?? 'new-sf'}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              runMutation(
                () =>
                  sheet.item
                    ? updateSavingsFundAction(fd)
                    : createSavingsFundAction(fd),
                sheet.item ? 'Savings fund updated' : 'Savings fund added',
                () => setSheet(null)
              );
            }}
            className="space-y-7"
          >
            {sheet.item && (
              <input type="hidden" name="id" value={sheet.item.id} />
            )}
            <Field label="Name">
              <input
                type="text"
                name="name"
                required
                autoFocus
                defaultValue={sheet.item?.name ?? ''}
                placeholder="e.g. Emergency Fund"
                className={fieldClass}
              />
            </Field>
            <Field label="Opening balance">
              <MoneyInput
                symbol={data.user.currencySymbol}
                name="openingBalance"
                step="0.01"
                required
                defaultValue={sheet.item?.openingBalance ?? 0}
                className="text-[17px]"
              />
            </Field>
            <Button type="submit" disabled={isPending} className="w-full">
              {sheet.item ? 'Save changes' : 'Add savings fund'}
            </Button>
          </form>
        )}

        {sheet?.kind === 'account' && (
          <form
            key={sheet.item?.id ?? 'new-acc'}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              runMutation(
                () =>
                  sheet.item
                    ? updateAccountAction(fd)
                    : createAccountAction(fd),
                sheet.item ? 'Account updated' : 'Account added',
                () => setSheet(null)
              );
            }}
            className="space-y-7"
          >
            {sheet.item && (
              <input type="hidden" name="id" value={sheet.item.id} />
            )}
            <Field label="Name">
              <input
                type="text"
                name="name"
                required
                autoFocus
                defaultValue={sheet.item?.name ?? ''}
                placeholder="e.g. City Bank"
                className={fieldClass}
              />
            </Field>
            <Field label="Type">
              <Combobox
                name="type"
                required
                options={ACCOUNT_TYPE_OPTIONS}
                value={accountType}
                onChange={(val) => setAccountType(val as AccountType | '')}
                placeholder="Select type"
              />
            </Field>
            <Field label="Opening balance">
              <MoneyInput
                symbol={data.user.currencySymbol}
                name="openingBalance"
                step="0.01"
                required
                defaultValue={sheet.item?.openingBalance ?? 0}
                className="text-[17px]"
              />
            </Field>
            <Button type="submit" disabled={isPending} className="w-full">
              {sheet.item ? 'Save changes' : 'Add account'}
            </Button>
          </form>
        )}
      </Sheet>
    </PageShell>
  );
}
