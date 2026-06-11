const express = require('express');
const router = express.Router()
var cors = require('cors');
router.use(cors());
router.use(express.json()); // axios 전송 사용하려면 이거 있어야 함
const multer  = require('multer')
const soap = require('soap');
const escapeQuotes = (str) => str.replaceAll("'", "\\\'").replaceAll('"', '\\\"').replaceAll('\\n', '\\\\n');



router.post('/request', async (req, res) => {
  const { name, phone } = req.body;
	console.log(name, phone);
	

  const client = await soap.createClientAsync('https://testws.baroservice.com/Kakaotalk.asmx?WSDL') // 테스트서버

	console.log(client);

	// const client = await soap.createClientAsync("https://ws.baroservice.com/Kakaotalk.asmx?WSDL") // 운영서버


  const certKeyOrigin = '78F825E4-990C-4447-AAE4-34117033CF69' // 테스트 인증키

  // const certKeyOrigin = '883B3958-8DC5-4F8E-A1B6-20CB953E0D69' // 운영 인증키


	// ---------------------------------------------------------------------------------------------------
	// API 레퍼런스 : https://dev.barobill.co.kr/docs/references/카카오톡전송-API#SendATKakaotalkEx
	// ---------------------------------------------------------------------------------------------------
	const certKey          = '78F825E4-990C-4447-AAE4-34117033CF69'
	const corpNum          = '4222002318'
	const senderId         = 'yeplat'
	const yellowId     	  = '@ministermore'
	const templateName     = '가입을환영합니다'
	const sendDT           = ''
	const smsReply         = 'N'
	const smsSenderNum     = ''
	const kakaotalkMessage = {
		ReceiverNum : phone,
		ReceiverName: name,
		Title       : '',
		Message     : `[사역자모아] 가입을 환영합니다
${name} 회원님! 사역자모아 가입을 환영합니다.`,
		SmsSubject  : '',
		SmsMessage  : '',
		Buttons     : {
			KakaotalkButton: [
				{
					Name      : '홈페이지',
					ButtonType: 'WL',
					Url1      : 'https://ministermore.co.kr/',
					Url2      : 'https://ministermore.co.kr/',
				},
			]
		},
	}

	const response = await client.SendATKakaotalkExAsync({
		CERTKEY         : certKey,
		CorpNum         : corpNum,
		SenderID        : senderId,
		YellowId    		: yellowId,
		TemplateName    : templateName,
		SendDT          : sendDT,
		SmsReply        : smsReply,
		SmsSenderNum    : smsSenderNum,
		KakaotalkMessage: kakaotalkMessage,
	})

	const result = response[0].SendATKakaotalkExResult;
	console.log('바로빌 반환 결과값:', result);

	// 바로빌은 실패 시 -로 시작하는 5자리 숫자를 반환합니다 (예: -10005)
	if (/^-[0-9]{5}$/.test(result)) { 
		console.error(`알림톡 발송 실패 코드: ${result}`);
		return res.send(false);
	} else { 
		console.log(`알림톡 발송 성공 (접수번호: ${result})`);
		return res.send(true);
	}


});







module.exports = router;
  