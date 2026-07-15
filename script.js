async function shorten(){

    const url=document.getElementById("url").value.trim();

    if(url==""){

        alert("اكتب الرابط");

        return;

    }

    const req=await fetch("/api/link",{

        method:"POST",

        headers:{

            "Content-Type":"application/json"

        },

        body:JSON.stringify({

            url

        })

    });

    const data=await req.json();

    if(!data.success){

        alert(data.message);

        return;

    }

    document.getElementById("result").innerHTML=`

        <p>${data.short}</p>

        <button class="copy" onclick="copyLink('${data.short}')">

        نسخ الرابط

        </button>

    `;

}

function copyLink(link){

    navigator.clipboard.writeText(link);

    alert("تم النسخ");

}
