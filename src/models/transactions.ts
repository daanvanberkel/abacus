import { createModel } from '@rematch/core';
import { RootModel } from './index';

export type TransactionSplitType = {
  description: string,
  amount: string,
  currencyDecimalPlaces: number,
  type: string,
  categoryName: string,
  currencyCode: string,
  currencySymbol: string,
  date: string,
  sourceName: string,
  destinationName: string,
  order: number
}

export type TransactionType = {
  id: string
  type: string
  attributes: {
    groupTitle: string
    transactions: TransactionSplitType[]
    user: string
    createdAt: string
    updatedAt: string
  },
}

export type TransactionStateType = {
  transactions: TransactionType[]
  page: number
  totalPages: number
}

const INITIAL_STATE = {
  page: 1,
  totalPages: 1,
} as TransactionStateType;

export default createModel<RootModel>()({

  state: INITIAL_STATE,

  reducers: {
    setTransactions(state, payload): TransactionStateType {
      const {
        page = state.page,
        totalPages = state.totalPages,
      } = payload;

      return {
        ...state,
        page,
        totalPages,
      };
    },

    resetState() {
      return INITIAL_STATE;
    },
  },

  effects: (dispatch) => ({
    /**
     * get transactions
     *
     * @returns {Promise}
     */
    async getTransactions(_: void, rootState): Promise<TransactionType[]> {
      const {
        firefly: {
          rangeDetails: {
            start,
            end,
          },
        },
        currencies: {
          current,
        },
      } = rootState;

      const type = 'all';
      const currentPage = 1;
      const {
        data: transactions,
        meta,
      } = await dispatch.configuration.apiFetch({ url: `/api/v1/currencies/${current?.attributes.code}/transactions?page=${currentPage}&start=${start}&end=${end}&type=${type}` }) as { data: TransactionType[], meta };

      dispatch.transactions.setTransactions({
        page: meta.pagination.currentPage,
        totalPages: meta.pagination.totalPages,
      });

      return transactions;
    },

    /**
     * get more transactions
     *
     * @returns {Promise}
     */
    async getMoreTransactions(_: void, rootState): Promise<TransactionType[]> {
      const {
        firefly: {
          rangeDetails: {
            start,
            end,
          },
        },
        transactions: {
          page = 1,
          totalPages = 1,
        },
        currencies: {
          current,
        },
      } = rootState;

      const type = 'all';
      const currentPage = (page < totalPages) ? page + 1 : 1;
      if (page < totalPages) {
        const {
          data: transactions,
          meta,
        } = await dispatch.configuration.apiFetch({ url: `/api/v1/currencies/${current?.attributes.code}/transactions?page=${currentPage}&start=${start}&end=${end}&type=${type}` }) as { data: TransactionType[], meta };

        dispatch.transactions.setTransactions({
          page: meta.pagination.currentPage,
          totalPages: meta.pagination.totalPages,
        });

        return transactions;
      }

      return [];
    },

    /**
     * create transaction
     *
     * @returns {Promise}
     */
    async createTransaction(payload) {
      const body = {
        transactions: [{
          // TODO: Add support for:
          /* piggy_bank_id: '2', */
          /* tags: 'test abaccus', */
          /* notes: 'test abaccus notes', */
          /* currency_id: '12', */
          /* foreign_amount: '123.45', */
          /* foreign_currencyId: '17', */
          description: payload.description,
          date: payload.date,
          source_name: payload.sourceName,
          destination_name: payload.destinationName,
          category_id: payload.categoryId,
          category_name: payload.categoryName,
          budget_id: payload.budgetId,
          budget_name: payload.budgetName,
          type: payload.type,
          amount: payload.amount.replace(/,/g, '.'),
        }],
        error_if_duplicate_hash: false,
        apply_rules: true,
        fire_webhooks: true,
      };

      const data = await dispatch.configuration.apiPost({ url: '/api/v1/transactions', body });

      return data;
    },

    /**
     * create transaction
     *
     * @returns {Promise}
     */
    async updateTransaction(payload) {
      const {
        id,
        transaction,
      } = payload;
      if (transaction.categoryName === '') {
        delete transaction.categoryId;
      }
      const body = {
        transactions: [{
          // TODO: Add support for:
          /* piggy_bank_id: '2', */
          /* tags: 'test abaccus', */
          /* notes: 'test abaccus notes', */
          /* currency_id: '12', */
          /* foreign_amount: '123.45', */
          /* foreign_currencyId: '17', */
          description: transaction.description,
          date: transaction.date,
          source_name: transaction.sourceName,
          destination_name: transaction.destinationName,
          category_id: transaction.categoryId,
          category_name: transaction.categoryName,
          budget_id: transaction.budgetId,
          budget_name: transaction.budgetName,
          type: transaction.type,
          amount: transaction.amount.replace(/,/g, '.'),
        }],
      };

      const data = await dispatch.configuration.apiPut({ url: `/api/v1/transactions/${id}`, body });

      return data;
    },

    /**
     * delete transaction by id
     *
     * @returns {Promise}
     */
    async deleteTransaction(id) {
      dispatch.configuration.apiDelete({ url: `/api/v1/transactions/${id}` });
    },

  }),
});
