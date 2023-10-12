import { IStore, Store } from "./store";

class MongoRepo implements IStoreRepo {
  async list(): Promise<IStore[]> {
    const stores = await Store.find();
    return stores;
  }

  async get(path: string): Promise<IStore | null> {
    const store = await Store.findOne({ path });
    return store;
  }

  async create(node: Pick<IStore, "name">): Promise<IStore> {
    const created = await Store.create(node);
    return created;
  }

  async delete(id: string): Promise<void> {
    await Store.deleteOne({ _id: id });
  }
}

// IStoreRepo is the interface for the Store DB layer
interface IStoreRepo {
  list(): Promise<IStore[]>;
  get(path: string): Promise<IStore | null>;
  create(node: Pick<IStore, "name">): Promise<IStore>;
  delete(id: string): Promise<void>;
}

export { MongoRepo, IStoreRepo };
