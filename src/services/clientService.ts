import { Billboard, Client } from '@/types'

/**
 * خدمة إدارة الزبائن
 * استخراج أسماء الزبائن من البيانات وإدارتهم
 */
class ClientService {
  
  /**
   * استخراج قائمة الزبائن الفريدة من اللوحات الإعلانية
   */
  getClientsFromBillboards(billboards: Billboard[]): Client[] {
    const clientMap = new Map<string, number>()
    
    billboards.forEach(billboard => {
      if (billboard.clientName && billboard.clientName.trim() !== '') {
        const clientName = billboard.clientName.trim()
        if (clientMap.has(clientName)) {
          clientMap.set(clientName, clientMap.get(clientName)! + 1)
        } else {
          clientMap.set(clientName, 1)
        }
      }
    })
    
    return Array.from(clientMap.entries()).map(([name, contractsCount]) => ({
      name,
      contractsCount
    })).sort((a, b) => a.name.localeCompare(b.name, 'ar'))
  }
  
  /**
   * فلترة اللوحات بناءً على الزبون المحدد (العقود الخاصة + المتاح)
   */
  filterBillboardsByClient(billboards: Billboard[], clientName: string | undefined): Billboard[] {
    if (!clientName || clientName.trim() === '') {
      return billboards
    }

    return billboards.filter(billboard =>
      // عرض العقود الخاصة بالزبون المحدد
      (billboard.clientName &&
       billboard.clientName.trim().toLowerCase() === clientName.trim().toLowerCase()) ||
      // أو عرض اللوحات المتاحة من جميع الزبائن
      billboard.status === 'متاح'
    )
  }

  /**
   * فلترة اللوحات حسب رقم العقد
   */
  filterBillboardsByContract(billboards: Billboard[], contractNumber: string | undefined): Billboard[] {
    if (!contractNumber || contractNumber.trim() === '') {
      return billboards
    }

    return billboards.filter(billboard =>
      billboard.contractNumber &&
      billboard.contractNumber.toLowerCase().includes(contractNumber.trim().toLowerCase())
    )
  }
  
  /**
   * التحقق من وجود زبون معين في قائمة الزبائن
   */
  isValidClient(clientName: string, clients: Client[]): boolean {
    return clients.some(client => 
      client.name.toLowerCase() === clientName.toLowerCase()
    )
  }
  
  /**
   * الحصول على إحصائيات الزبون
   */
  getClientStats(billboards: Billboard[], clientName: string): {
    totalBillboards: number
    availableBillboards: number
    bookedBillboards: number
    soonBillboards: number
  } {
    const clientBillboards = this.filterBillboardsByClient(billboards, clientName)
    
    const stats = {
      totalBillboards: clientBillboards.length,
      availableBillboards: 0,
      bookedBillboards: 0,
      soonBillboards: 0
    }
    
    clientBillboards.forEach(billboard => {
      switch (billboard.status) {
        case 'متاح':
          stats.availableBillboards++
          break
        case 'محجوز':
          stats.bookedBillboards++
          break
        case 'قريباً':
          stats.soonBillboards++
          break
      }
    })
    
    return stats
  }
  
  /**
   * البحث عن زبائن بناءً على الاسم
   */
  searchClients(clients: Client[], searchTerm: string): Client[] {
    if (!searchTerm || searchTerm.trim() === '') {
      return clients
    }
    
    const term = searchTerm.trim().toLowerCase()
    return clients.filter(client => 
      client.name.toLowerCase().includes(term)
    )
  }
}

export const clientService = new ClientService()
