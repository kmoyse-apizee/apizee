import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { ApiRtcService } from '../api-rtc.service';

@Component({
  selector: 'app-one-to-one',
  templateUrl: './one-to-one.component.html',
  styleUrls: ['./one-to-one.component.css']
})
export class OneToOneComponent implements OnInit {

  @ViewChild("localVideo") localVideoRef: ElementRef;
  @ViewChild("remoteVideo") remoteVideoRef: ElementRef;

  // apiRTC objects
  userAgent:any;
  session: any;

  uuid: string;

  id: string;
  message: string;

  in_message: string;

  _call: any;

  constructor(private apiRtcService: ApiRtcService) {
    this.userAgent = this.apiRtcService.createUserAgent();
    this.uuid = this.apiRtcService.uuidv4();
  }

  ngOnInit(): void {

    const self = this;
    
    this.userAgent.register({
      id: this.uuid // OPTIONAL // This is used for setting userId
    }).then(session => {
      // ok
      console.log("Registration " + this.uuid + " OK");
      this.session = session;

      this.session.on('contactMessage', function (e) {
        //Display message in UI
        //if (e.sender === activeContact) {
        //    $('#message-list').append('<li><b>' + e.sender.getId() + '</b> : ' + e.content + '</li>');
        //}
        self.in_message = e.content ? e.content : null;
        console.log("session1::on.contactMessage|" + JSON.stringify(e))
      });


      this.session.on('incomingCall', function (invitation) {
        console.log("MAIN - incomingCall");
        //==============================
        // ACCEPT CALL INVITATION
        //==============================
        invitation.accept()
          .then(function (call) {
            self._call = call;
            self.setCallListeners(call);

            //TODO
            //addHangupButton(call.getId());
          });
        // Display hangup button
        //document.getElementById('hangup').style.display = 'inline-block';
      })

      this.session.on("incomingScreenSharingCall", function (call) { //When client receives an screenSharing call from another user
        console.log("screenSharing received from :", call.getContact().id);
        //setCallListeners(call);
        //TODO
        //addHangupButton(call.getId());
      });


    }).catch(error => {
      // error
      console.log("Registration 1 error");
    });

    // this.apiRtcService.getUserAgent().register({
    // 	id: 2 // OPTIONAL // This is used for setting userId
    // }).then(session => {
    // 	// ok
    // 	console.log("Registration 2 OK");
    // 	this.session2 = session;

    // 	this.session2.on('contactMessage', function (e) {
    // 		//Display message in UI
    // 		//if (e.sender === activeContact) {
    // 		//    $('#message-list').append('<li><b>' + e.sender.getId() + '</b> : ' + e.content + '</li>');
    // 		//}
    // 		console.log("session2::on.contactMessage|" + JSON.stringify(e))
    // 	});
    // }).catch(error => {
    // 	// error
    // 	console.log("Registration 2 error");
    // });
  }

  setCallListeners(call: any) {
    const self = this;
    call.on("localStreamAvailable", function (stream) {
      console.log('on localStreamAvailable :', stream);
      //document.getElementById('local-media').remove();

      // Subscribed Stream is available for display
      // Get remote media container
      //var container = document.getElementById('remote-container');
      // Create media element
      //var mediaElement = document.createElement('video');
      //var mediaElement: any = document.getElementById('localVideo');
      //mediaElement.id = 'remote-media-' + stream.streamId;
      self.localVideoRef.nativeElement.autoplay = true;
      self.localVideoRef.nativeElement.muted = false;
      // Add media element to media container
      //container.appendChild(mediaElement);
      // Attach stream
      stream.attachToElement(self.localVideoRef.nativeElement);
      //addStreamInDiv(stream, 'local-container', 'local-media-' + stream.getId(), { width: "160px", height: "120px" }, true);
      stream
        .on("stopped", function () { //When client receives an screenSharing call from another user
          console.error("on Stream stopped");
          //$('#local-media-' + stream.getId()).remove();
        });
    })
    call.on("streamAdded", function (stream) {
      console.log('on streamAdded :', stream);
      //addStreamInDiv(stream, 'remote-container', 'remote-media-' + stream.getId(), { width: "640px", height: "480px" }, false);
      //var mediaElement: any = document.getElementById('remoteVideo');
      self.remoteVideoRef.nativeElement.autoplay = true;
      self.remoteVideoRef.nativeElement.muted = false;
      // Attach stream
      stream.attachToElement(self.remoteVideoRef.nativeElement);

    })
    call.on('streamRemoved', function (stream) {
      console.log('on streamRemoved :', stream);
      // Remove media element
      //document.getElementById('remote-media-' + stream.getId()).remove();

    })
    call.on('userMediaError', function (e) {
      console.log('on userMediaError detected : ', e);
      console.log('on userMediaError detected with error : ', e.error);

      //Checking if tryAudioCallActivated
      if (e.tryAudioCallActivated === false) {
        //$('#hangup-' + call.getId()).remove();
      }
    })
    call.on('desktopCapture', function (e) {
      console.log('on desktopCapture event : ', e);
      //$('#hangup-' + call.getId()).remove();
    })
    call.on('hangup', function () {
      console.log('on hangup :');
      //$('#hangup-' + call.getId()).remove();
    });
  }

  sendMsg(id: string, msg: string): void {

    console.log("sendMsg(" + id + "," + msg + ")");

    //let userAgentId_2 = "2";
    let contact = this.session.getOrCreateContact(id);
    if (contact !== null) {
      console.log("Sending:", msg)
      contact.sendMessage(msg);
    } else {
      console.log("contact is null")
    }

    //throw new Error("Method not implemented.");

  }

  call(id: string): void {
    var contact = this.session.getOrCreateContact(id);
    var call = contact.call();
    this._call = call;
    this.setCallListeners(call);
  }

  hangUp(): void {
    //var call = connectedSession.getCall(callId);
    this._call.hangUp();
  }

}
