import { Repository } from "typeorm";
import { ITenantData, UserQueryParams } from "../types";
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

  async getAll(validateQuery: UserQueryParams) {
    const queryBuilder = this.tenantRepository.createQueryBuilder("tenant");

    const result = await queryBuilder
      .skip((validateQuery.currentPage - 1) * validateQuery.perPage)
      .take(validateQuery.perPage)
      .orderBy("tenant.id", "DESC") // keep neweast created user at first
      .getManyAndCount();

    return result;
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
