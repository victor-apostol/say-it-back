import { Injectable } from "@nestjs/common";

@Injectable()
export class NotificationsService {
  handleNotification(number: number) {

  }
}

// import { Injectable } from '@nestjs/common';
// 
// @Injectable()
// export class EventService {
  // private clients: any[] = [];
// 
  // addClient(client: any) {
    // this.clients.push(client);
  // }
// 
  // removeClient(client: any) {
    // const index = this.clients.indexOf(client);
    // if (index !== -1) {
      // this.clients.splice(index, 1);
    // }
  // }
// 
  // sendEventToAllClients(event: any) {
    // this.clients.forEach(client => {
      // client.sseSend(event);
    // });
  // }
// }
// 