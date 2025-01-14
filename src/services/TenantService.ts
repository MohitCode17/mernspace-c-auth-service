import { Repository } from "typeorm";
import { ITenantData } from "../types";
import createHttpError from "http-errors";
import { Tenant } from "../entity/Tenant";

export class TenantService {
  constructor(private tenantRepository: Repository<Tenant>) {}

  async create(tenantData: ITenantData) {
    try {
      return await this.tenantRepository.save(tenantData);
    } catch {
      const error = createHttpError(500, "Failed to create tenant.");
      throw error;
    }
  }

  async getAll() {
    return await this.tenantRepository.find();
  }

  async getOne(tenantId: number) {
    return await this.tenantRepository.findOne({ where: { id: tenantId } });
  }

  async update(tenantId: number, tenantData: ITenantData) {
    return await this.tenantRepository.update(tenantId, tenantData);
  }

  async deleteById(tenantId: number) {
    return await this.tenantRepository.delete(tenantId);
  }
}
